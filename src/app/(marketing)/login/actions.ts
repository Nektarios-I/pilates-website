'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type ResolveSignInResult =
  | { success: true; email: string }
  | { success: false; error: string };

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
    return { success: false, error: 'Could not look up that name. Try your email instead.' };
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
