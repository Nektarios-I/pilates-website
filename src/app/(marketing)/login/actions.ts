'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/lib/supabase/admin';
import { safe_auth_next_path } from '@/lib/auth/safe-auth-redirect';
import { createClient } from '@/lib/supabase/server';

export type ResolveSignInResult =
  | { success: true; email: string }
  | { success: false; error: string };

export type SignInResult = { success: true } | { success: false; error: string };

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
    return 'Incorrect email/name or password. Check your details and try again.';
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

export async function resolve_sign_in_email(identifier: string): Promise<ResolveSignInResult> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { success: false, error: 'Email or name is required.' };
  }

  if (trimmed.includes('@')) {
    return { success: true, email: trimmed.toLowerCase() };
  }

  const normalized_name = trimmed.toUpperCase().replace(/\s+/g, ' ');
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      success: false,
      error:
        'Name-based sign-in is unavailable. Sign in with your email address, or contact support if this persists.',
    };
  }

  const { data, error } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('full_name', normalized_name);

  if (error) {
    return { success: false, error: map_network_error(error.message) };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'No account found with that name. Use ALL CAPS NAME SURNAME or your email.',
    };
  }

  if (data.length > 1) {
    return { success: false, error: 'Multiple accounts match that name. Sign in with your email.' };
  }

  return { success: true, email: data[0].email };
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
    return { success: false, error: 'Email or name and password are required.' };
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
