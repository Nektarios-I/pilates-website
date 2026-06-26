import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata } from '@/lib/metadata';

import { list_removable_users } from './actions';
import { RemoveAccountsPanel } from './remove-accounts-panel';

export const metadata = createPageMetadata({
  title: 'Remove Account',
  description: 'Remove studio accounts. Access is restricted by role.',
  path: '/staff/remove',
});

export default async function RemoveAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const users = await list_removable_users();

  return (
    <Container>
      <div className="py-8 sm:py-12">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
            href="/account"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Back to account
          </Link>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-foreground/60">
            Staff portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Remove account
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-foreground/70">
            Permanently delete a studio account. This action cannot be undone. The list below
            shows only accounts you have permission to remove.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Account list */}
          <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
            <h2 className="mb-4 text-base font-semibold text-foreground">Accounts</h2>
            <RemoveAccountsPanel users={users} />
          </div>

          {/* Info panel */}
          <aside className="space-y-6">
            <div className="rounded-md border border-border bg-muted p-6">
              <h2 className="text-sm font-semibold text-foreground">Removal permissions</h2>
              <ul className="mt-4 space-y-3">
                {[
                  { role: 'Admin', can: 'Can remove any account.' },
                  { role: 'Owner', can: 'Can remove instructors and clients.' },
                  { role: 'Instructor', can: 'Can remove clients only.' },
                ].map(({ role, can }) => (
                  <li key={role} className="text-sm text-foreground/70">
                    <span className="font-medium text-foreground">{role}</span>{' '}
                    <span>{can}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-warning-border bg-warning-surface p-6">
              <h2 className="text-sm font-semibold text-warning-foreground">Permanent deletion</h2>
              <p className="mt-2 text-sm leading-6 text-warning-foreground">
                Removing an account deletes the user permanently from the authentication system
                and all related studio data. This cannot be undone. Re-invite via Add Account if
                needed.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}
