import Link from 'next/link';

import { SiteNavigation } from '@/components/layout/site-navigation';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { site_content } from '@/config/site_content';
import { createClient } from '@/lib/supabase/server';

// Roles that grant access to staff pages (Add Account, Remove Account).
const STAFF_ROLES = ['owner', 'admin', 'instructor'] as const;

type HeaderAuth = {
  is_signed_in: boolean;
  is_staff: boolean;
  display_name: string | null;
};

// Fetches the current user, their staff status, and their display name.
// Returns safe defaults if Supabase is not yet configured or the DB isn't set up.
async function get_header_auth(): Promise<HeaderAuth> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { is_signed_in: false, is_staff: false, display_name: null };

    const [roles_result, profile_result] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    ]);

    const is_staff =
      (roles_result.data ?? []).some((r) =>
        (STAFF_ROLES as readonly string[]).includes(r.role),
      ) ?? false;

    // Show first name from profile, fall back to email prefix.
    const full_name = profile_result.data?.full_name ?? null;
    const display_name = full_name
      ? full_name.split(' ')[0]
      : (user.email?.split('@')[0] ?? null);

    return { is_signed_in: true, is_staff, display_name };
  } catch {
    // Supabase not yet configured or DB not set up — render header without auth UI.
    return { is_signed_in: false, is_staff: false, display_name: null };
  }
}

export async function SiteHeader() {
  const { is_signed_in, is_staff, display_name } = await get_header_auth();
  const utility_link_class =
    'whitespace-nowrap text-sm font-medium text-stone-700 transition-colors hover:text-stone-950';

  return (
    <header className="border-b border-stone-200 bg-background">
      <Container className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Link
          className="shrink-0 text-base font-semibold tracking-wide text-stone-950"
          href="/"
        >
          {site_content.studio_info.studio_name}
        </Link>

        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center">
          <SiteNavigation label="Primary navigation" />

          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 lg:flex-nowrap">
            {/* Sign in — shown only when no session is active */}
            {!is_signed_in && (
              <Link className={utility_link_class} href="/login">
                Sign in
              </Link>
            )}

            {/* Add account — shown only for owner / admin / instructor */}
            {is_signed_in && is_staff && (
              <Link className={utility_link_class} href="/staff/invite">
                Add account
              </Link>
            )}

            {/* Remove account — shown only for owner / admin / instructor */}
            {is_signed_in && is_staff && (
              <Link className={utility_link_class} href="/staff/remove">
                Remove account
              </Link>
            )}

            {/* Account — shown for any signed-in user */}
            {is_signed_in && (
              <Link className={utility_link_class} href="/account">
                Account
              </Link>
            )}

            {/* Greeting — shows signed-in user's first name */}
            {is_signed_in && display_name && (
              <span className="whitespace-nowrap text-sm text-stone-500">Hi, {display_name}</span>
            )}

            {/* Book Now — always visible */}
            <ButtonLink className="shrink-0 px-4" href={site_content.primary_cta.href}>
              {site_content.primary_cta.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </header>
  );
}
