import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function createClient() {
  const cookie_store = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookie_store.getAll();
      },
      setAll(cookies_to_set) {
        try {
          cookies_to_set.forEach(({ name, value, options }) =>
            cookie_store.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
