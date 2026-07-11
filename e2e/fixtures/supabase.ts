import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { e2e_client_email, e2e_client_password } from './env';

function require_env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export async function create_authenticated_supabase_client(): Promise<SupabaseClient> {
  const supabase = createClient(
    require_env('NEXT_PUBLIC_SUPABASE_URL'),
    require_env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  );

  const { error } = await supabase.auth.signInWithPassword({
    email: e2e_client_email(),
    password: e2e_client_password(),
  });

  if (error) {
    throw new Error(`E2E Supabase sign-in failed: ${error.message}`);
  }

  return supabase;
}

export async function get_active_package_credits(
  supabase: SupabaseClient,
  user_id: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('user_packages')
    .select('credits_remaining')
    .eq('user_id', user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to read package credits: ${error.message}`);
  return data?.credits_remaining ?? null;
}

export async function get_booking_status(
  supabase: SupabaseClient,
  booking_id: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', booking_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to read booking status: ${error.message}`);
  return data?.status ?? null;
}
