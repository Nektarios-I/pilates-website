import { createClient } from '@supabase/supabase-js';

// Creates a Supabase client with the service role key.
// This client bypasses RLS and has full database access.
// NEVER expose this client or its key to the browser.
// ONLY use this in server actions and API routes.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service_key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service_key) {
    throw new Error(
      'createAdminClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.',
    );
  }

  return createClient(url, service_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
