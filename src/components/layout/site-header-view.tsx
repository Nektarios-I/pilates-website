import Link from 'next/link';

import { AccountMenu } from '@/components/layout/account-menu';
import { SiteNavigation } from '@/components/layout/site-navigation';
import { StudioLogo } from '@/components/layout/studio-logo';
import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { site_content } from '@/config/site_content';

export type HeaderAuth = {
  is_signed_in: boolean;
  is_staff: boolean;
  is_admin_or_owner: boolean;
  display_name: string | null;
};

type SiteHeaderViewProps = {
  auth: HeaderAuth;
};

export function SiteHeaderView({ auth }: SiteHeaderViewProps) {
  const { is_signed_in, is_staff, is_admin_or_owner, display_name } = auth;

  return (
    <header className="border-b border-stone-200 bg-background">
      <Container className="flex flex-wrap items-center gap-x-6 gap-y-4 py-4">
        <StudioLogo className="order-1 shrink-0" />

        <div className="order-2 ms-auto flex shrink-0 items-center lg:order-3">
          {is_signed_in ? (
            <AccountMenu
              display_name={display_name}
              is_admin_or_owner={is_admin_or_owner}
              is_staff={is_staff}
            />
          ) : (
            <Link
              className="text-sm font-medium text-stone-700 transition-colors hover:text-stone-950"
              href="/login"
            >
              Sign in
            </Link>
          )}
        </div>

        <div className="order-3 flex w-full basis-full items-center justify-between gap-4 lg:order-2 lg:w-auto lg:flex-1 lg:justify-center lg:basis-auto">
          <SiteNavigation label="Primary navigation" />
          <ButtonLink className="shrink-0 px-4" href={site_content.primary_cta.href}>
            {site_content.primary_cta.label}
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
