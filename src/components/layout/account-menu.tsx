'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition } from 'react';

import { signOut } from '@/app/(marketing)/login/actions';

type AccountMenuProps = {
  is_staff: boolean;
  is_admin_or_owner: boolean;
  display_name: string | null;
};

const link_class =
  'block rounded-sm px-3 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-950';
const button_class = `${link_class} w-full text-left`;

export function AccountMenu({ is_staff, is_admin_or_owner, display_name }: AccountMenuProps) {
  const router = useRouter();
  const [open, set_open] = useState(false);
  const [is_pending, start_transition] = useTransition();
  const menu_ref = useRef<HTMLDivElement>(null);
  const menu_id = useId();

  useEffect(() => {
    function handle_pointer_down(event: MouseEvent) {
      if (menu_ref.current && !menu_ref.current.contains(event.target as Node)) {
        set_open(false);
      }
    }

    document.addEventListener('mousedown', handle_pointer_down);
    return () => document.removeEventListener('mousedown', handle_pointer_down);
  }, []);

  function close_menu() {
    set_open(false);
  }

  function handle_sign_out() {
    start_transition(async () => {
      close_menu();
      await signOut();
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={menu_ref}>
      <button
        aria-controls={menu_id}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:text-stone-950"
        onClick={() => set_open((value) => !value)}
        type="button"
      >
        Account
        <svg
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 min-w-[11rem] rounded-md border border-stone-200 bg-white py-1 shadow-lg"
          id={menu_id}
          role="menu"
        >
          {display_name ? (
            <p className="border-b border-stone-100 px-3 py-2 text-xs text-stone-500">
              Signed in as {display_name}
            </p>
          ) : null}

          <Link className={link_class} href="/account" onClick={close_menu} role="menuitem">
            Account
          </Link>

          {is_admin_or_owner ? (
            <>
              <Link
                className={link_class}
                href="/staff/schedule"
                onClick={close_menu}
                role="menuitem"
              >
                Studio schedule
              </Link>
              <Link
                className={link_class}
                href="/staff/session-cards"
                onClick={close_menu}
                role="menuitem"
              >
                Session cards
              </Link>
            </>
          ) : null}

          {is_staff ? (
            <>
              <Link
                className={link_class}
                href="/staff/invite"
                onClick={close_menu}
                role="menuitem"
              >
                Add account
              </Link>
              <Link
                className={link_class}
                href="/staff/remove"
                onClick={close_menu}
                role="menuitem"
              >
                Remove account
              </Link>
              <Link
                className={link_class}
                href="/staff/membership"
                onClick={close_menu}
                role="menuitem"
              >
                Manage membership
              </Link>
            </>
          ) : null}

          <button
            className={button_class}
            disabled={is_pending}
            onClick={handle_sign_out}
            role="menuitem"
            type="button"
          >
            {is_pending ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
