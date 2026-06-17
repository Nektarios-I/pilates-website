'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Magic link sign-in is handled client-side in login-form.tsx so the PKCE
// verifier cookie is stored in the user's browser. Do not call signInWithOtp
// from a server action — it breaks the callback exchange.

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
