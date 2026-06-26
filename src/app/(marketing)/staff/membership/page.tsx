import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata } from '@/lib/metadata';

import { list_manageable_clients, list_membership_packages } from './actions';
import { MembershipPanel } from './membership-panel';

export const metadata = createPageMetadata({
  title: 'Manage Membership',
  description: 'Apply, deactivate, and adjust memberships for client accounts.',
  path: '/staff/membership',
});

export default async function ManageMembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [clients, packages] = await Promise.all([
    list_manageable_clients(),
    list_membership_packages(),
  ]);

  return (
    <Container>
      <div className="py-8 sm:py-12">
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

        <div className="mb-8 max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-foreground/60">
            Staff portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Manage membership
          </h1>
          <p className="mt-3 text-base leading-7 text-foreground/70">
            Apply a package to a client account, deactivate a membership, or adjust remaining
            credits.
          </p>
        </div>

        <div className="max-w-3xl rounded-md border border-border bg-surface p-6 sm:p-8">
          <MembershipPanel clients={clients} packages={packages} />
        </div>
      </div>
    </Container>
  );
}
