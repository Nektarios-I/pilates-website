import { SiteHeaderView } from '@/components/layout/site-header-view';
import { build_header_auth, unsigned_header_auth } from '@/lib/auth/header-auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function get_header_auth() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return unsigned_header_auth;

    const [roles_result, profile_result] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    ]);

    return build_header_auth(user, roles_result.data, profile_result.data?.full_name);
  } catch {
    return unsigned_header_auth;
  }
}

export async function SiteHeader() {
  const auth = await get_header_auth();
  return <SiteHeaderView auth={auth} />;
}
