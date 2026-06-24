'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { AccountMenu } from '@/components/layout/account-menu';
import { SiteNavigation } from '@/components/layout/site-navigation';
import { StudioLogo } from '@/components/layout/studio-logo';
import { ButtonLink } from '@/components/ui/button-link';
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
  const [mobile_menu_open, set_mobile_menu_open] = useState(false);
  const menu_button_ref = useRef<HTMLButtonElement>(null);
  const first_mobile_link_ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!mobile_menu_open) return;

    first_mobile_link_ref.current?.focus();

    function handle_key_down(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      set_mobile_menu_open(false);
      menu_button_ref.current?.focus();
    }

    document.addEventListener('keydown', handle_key_down);
    return () => document.removeEventListener('keydown', handle_key_down);
  }, [mobile_menu_open]);

  function close_mobile_menu() {
    set_mobile_menu_open(false);
  }

  const auth_control = is_signed_in ? (
    <AccountMenu
      display_name={display_name}
      is_admin_or_owner={is_admin_or_owner}
      is_staff={is_staff}
    />
  ) : (
    <Link
      className="inline-flex min-h-11 items-center font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80 transition-opacity duration-200 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A678]"
      href="/login"
    >
      Sign in
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F4F1E8] flex items-center justify-between px-4 md:px-8 py-6 transition-colors relative">
      <StudioLogo className="shrink-0" />

      <SiteNavigation label="Primary navigation" />

      <div className="flex shrink-0 items-center gap-2">
        <div>{auth_control}</div>
        <div className="hidden md:block">
          <ButtonLink className="shrink-0" href={site_content.primary_cta.href}>
            {site_content.primary_cta.label}
          </ButtonLink>
        </div>
        <button
          ref={menu_button_ref}
          aria-controls="mobile-site-menu"
          aria-expanded={mobile_menu_open}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-[#2D3A1F] bg-transparent border-0 hover:opacity-80 transition-opacity duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A678] md:hidden"
          type="button"
          onClick={() => set_mobile_menu_open((open) => !open)}
        >
          <span className="sr-only">{mobile_menu_open ? 'Close menu' : 'Open menu'}</span>
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            {mobile_menu_open ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {mobile_menu_open ? (
        <div
          className="absolute left-0 right-0 top-full w-full bg-[#F4F1E8] flex flex-col gap-6 px-4 py-8 border-t border-[#CDD2C9] md:hidden"
          id="mobile-site-menu"
        >
          <nav aria-label="Mobile navigation">
            <ul className="flex flex-col gap-6">
              {site_content.navigation_items.map((item, index) => (
                <li key={item.href}>
                  <Link
                    ref={index === 0 ? first_mobile_link_ref : undefined}
                    className="flex min-h-11 items-center font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80 transition-opacity duration-200 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A678]"
                    href={item.href}
                    onClick={close_mobile_menu}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink
              className="mt-6 w-full justify-center"
              href={site_content.primary_cta.href}
              onClick={close_mobile_menu}
            >
              {site_content.primary_cta.label}
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
