import { createClient } from '@supabase/supabase-js';

import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

// Creates a Supabase client with the service role key.
// This client bypasses RLS and has full database access.
// NEVER expose this client or its key to the browser.
// ONLY use this in server actions and API routes.
export function createAdminClient() {
  const url = getSupabaseUrl();
  const service_key = getSupabaseServiceRoleKey();

  if (!service_key) {
    throw new Error(
      'createAdminClient: SUPABASE_SERVICE_ROLE_KEY must be set.',
    );
  }

  return createClient(url, service_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
