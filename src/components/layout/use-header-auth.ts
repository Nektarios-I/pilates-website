'use client';

import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  build_header_auth,
  merge_header_auth,
  type HeaderAuth,
  unsigned_header_auth,
} from '@/lib/auth/header-auth';
import { createClient } from '@/lib/supabase/client';

async function header_auth_from_session(session: Session): Promise<HeaderAuth> {
  const supabase = createClient();
  const user = session.user;

  const [roles_result, profile_result] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ]);

  return build_header_auth(user, roles_result.data, profile_result.data?.full_name);
}

/**
 * Keeps header auth in sync when the client session changes before the shared
 * marketing layout re-renders (e.g. password sign-in via soft navigation).
 */
export function useHeaderAuth(server_auth: HeaderAuth): HeaderAuth {
  const router = useRouter();
  const [client_auth, set_client_auth] = useState<HeaderAuth | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function sync_session(session: Session | null) {
      if (!session?.user) {
        set_client_auth(unsigned_header_auth);
        return;
      }

      const live_auth = await header_auth_from_session(session);
      set_client_auth(live_auth);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !server_auth.is_signed_in) {
        void sync_session(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        set_client_auth(unsigned_header_auth);
        router.refresh();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await sync_session(session);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, server_auth.is_signed_in]);

  return merge_header_auth(server_auth, client_auth);
}
