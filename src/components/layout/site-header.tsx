import { SiteHeaderView, type HeaderAuth } from '@/components/layout/site-header-view';
import { createClient } from '@/lib/supabase/server';

const STAFF_ROLES = ['owner', 'admin', 'instructor'] as const;

const unsigned_auth: HeaderAuth = {
  is_signed_in: false,
  is_staff: false,
  is_admin_or_owner: false,
  display_name: null,
};

async function get_header_auth(): Promise<HeaderAuth> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return unsigned_auth;

    const [roles_result, profile_result] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    ]);

    const role_values = (roles_result.data ?? []).map((r) => r.role);
    const is_staff = role_values.some((r) =>
      (STAFF_ROLES as readonly string[]).includes(r),
    );
    const is_admin_or_owner = role_values.some((r) => r === 'owner' || r === 'admin');

    const full_name = profile_result.data?.full_name ?? null;
    const display_name = full_name
      ? full_name.split(' ')[0]
      : (user.email?.split('@')[0] ?? null);

    return { is_signed_in: true, is_staff, is_admin_or_owner, display_name };
  } catch {
    return unsigned_auth;
  }
}

export async function SiteHeader() {
  const auth = await get_header_auth();
  return <SiteHeaderView auth={auth} />;
}
