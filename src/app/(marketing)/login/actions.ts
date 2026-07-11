'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  is_internal_auth_email,
  looks_like_phone_identifier,
  normalize_email,
  phones_match,
} from '@/lib/auth/account-identifiers';
import { createAdminClient } from '@/lib/supabase/admin';
import { safe_auth_next_path } from '@/lib/auth/safe-auth-redirect';
import { createClient } from '@/lib/supabase/server';

export type ResolveSignInResult =
  | { success: true; email: string }
  | { success: false; error: string };

export type SignInResult = { success: true } | { success: false; error: string };

type ProfileLookupRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
};

function map_network_error(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('network')) {
    return 'Could not reach the authentication service. Check your internet connection and try again.';
  }
  return message;
}

function map_password_sign_in_error(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid password')) {
    return 'Incorrect login details or password. Check your details and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Your email has not been confirmed yet. Check your inbox for a confirmation email.';
  }
  return map_network_error(message);
}

function map_otp_sign_in_error(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('expired') || msg.includes('invalid')) {
    return 'That code is invalid or has expired. Click "Back" to request a new one.';
  }
  return map_network_error(message);
}

function finish_sign_in(next_path?: string): never {
  revalidatePath('/', 'layout');
  redirect(safe_auth_next_path(next_path));
}

async function resolve_auth_email_for_profile(profile: ProfileLookupRow): Promise<string | null> {
  if (profile.email?.trim()) {
    return normalize_email(profile.email);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(profile.id);
  if (error || !data.user?.email) {
    console.error('[resolve_auth_email_for_profile] getUserById failed:', error?.message);
    return null;
  }

  return normalize_email(data.user.email);
}

async function lookup_profiles_by_phone(phone: string): Promise<ProfileLookupRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name, phone')
    .not('phone', 'is', null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((row) => phones_match(row.phone, phone));
}

export async function resolve_sign_in_email(identifier: string): Promise<ResolveSignInResult> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { success: false, error: 'Name, email, or phone is required.' };
  }

  if (trimmed.includes('@')) {
    if (is_internal_auth_email(trimmed)) {
      return {
        success: false,
        error: 'Login with your name or phone number instead.',
      };
    }
    return { success: true, email: normalize_email(trimmed) };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      success: false,
      error:
        'Name or phone login is unavailable. Login with your email address, or contact support if this persists.',
    };
  }

  if (looks_like_phone_identifier(trimmed)) {
    try {
      const matches = await lookup_profiles_by_phone(trimmed);
      if (matches.length === 0) {
        return {
          success: false,
          error: 'No account found with that phone number. Check the number or login with your name.',
        };
      }

      if (matches.length > 1) {
        return {
          success: false,
          error: 'Multiple accounts match that phone number. Login with your name instead.',
        };
      }

      const auth_email = await resolve_auth_email_for_profile(matches[0]);
      if (!auth_email) {
        return {
          success: false,
          error: 'Could not resolve this account for login. Contact the studio for help.',
        };
      }

      return { success: true, email: auth_email };
    } catch (error) {
      return {
        success: false,
        error: map_network_error(error instanceof Error ? error.message : 'Lookup failed.'),
      };
    }
  }

  const normalized_name = trimmed.toUpperCase().replace(/\s+/g, ' ');
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name, phone')
    .eq('full_name', normalized_name);

  if (error) {
    return { success: false, error: map_network_error(error.message) };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'No account found with that name. Use ALL CAPS NAME SURNAME, your email, or phone.',
    };
  }

  if (data.length > 1) {
    return {
      success: false,
      error: 'Multiple accounts match that name. Login with your email or phone.',
    };
  }

  const auth_email = await resolve_auth_email_for_profile(data[0]);
  if (!auth_email) {
    return {
      success: false,
      error: 'Could not resolve this account for login. Contact the studio for help.',
    };
  }

  return { success: true, email: auth_email };
}

/**
 * Standard Supabase SSR password sign-in — session cookies are written on the server.
 * @see docs/auth-sign-in-flow.md
 */
export async function sign_in_with_password(
  identifier: string,
  password: string,
  next_path?: string,
): Promise<SignInResult> {
  if (!identifier.trim() || !password) {
    return { success: false, error: 'Login details and password are required.' };
  }

  const resolved = await resolve_sign_in_email(identifier);
  if (!resolved.success) return resolved;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: resolved.email,
    password,
  });

  if (error) {
    return { success: false, error: map_password_sign_in_error(error.message) };
  }

  finish_sign_in(next_path);
}

/** Server-side OTP verification — session cookies are written on the server. */
export async function verify_sign_in_otp(
  email: string,
  token: string,
  next_path?: string,
): Promise<SignInResult> {
  const trimmed_email = email.trim();
  const trimmed_token = token.trim();

  if (!trimmed_email) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!trimmed_token) {
    return { success: false, error: 'Please enter the 6-digit code from your email.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: trimmed_email,
    token: trimmed_token,
    type: 'email',
  });

  if (error) {
    return { success: false, error: map_otp_sign_in_error(error.message) };
  }

  finish_sign_in(next_path);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
