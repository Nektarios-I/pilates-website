import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata } from '@/lib/metadata';

import { InviteForm } from './invite-form';
import type { InviteRole } from './actions';

export const metadata = createPageMetadata({
  title: 'Create Account Invitation',
  description: 'Invite a new team member or client to the studio platform.',
  path: '/staff/invite',
});

// Role priority — highest-privilege role wins when a user holds multiple.
const ROLE_PRIORITY: InviteRole[] = ['admin', 'owner', 'instructor', 'client'];

export default async function StaffInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware protects /staff/* — this is a belt-and-suspenders check.
  if (!user) {
    redirect('/login');
  }

  // Resolve the user's highest-privilege role.
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role_values = (roles ?? []).map((r) => r.role as InviteRole);
  const current_role: InviteRole | null =
    ROLE_PRIORITY.find((r) => role_values.includes(r)) ?? null;

  return (
    <Container>
      <div className="py-8 sm:py-12">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-950"
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
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
            Staff portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
            Create account invitation
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-stone-600">
            Invite a team member or client to join the studio platform. Choose their role and how
            they will receive their invitation.
          </p>
        </div>

        {/* Two-column layout: form left, info panel right (desktop) */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Form card */}
          <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
            <InviteForm currentRole={current_role} />
          </div>

          {/* Info side panel — desktop only */}
          <aside className="hidden space-y-6 lg:block">
            <div className="rounded-md border border-border bg-muted p-6">
              <h2 className="text-sm font-semibold text-stone-950">Who can invite whom</h2>
              <ul className="mt-4 space-y-3">
                {[
                  { role: 'Instructor', can: 'Can invite clients only.' },
                  { role: 'Owner', can: 'Can invite clients and instructors.' },
                  { role: 'Admin', can: 'Can invite all account types.' },
                ].map(({ role, can }) => (
                  <li key={role} className="text-sm text-stone-600">
                    <span className="font-medium text-stone-950">{role}</span>{' '}
                    <span>{can}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-border bg-muted p-6">
              <h2 className="text-sm font-semibold text-stone-950">Invitation methods</h2>
              <ul className="mt-4 space-y-4">
                {[
                  {
                    method: 'Email + Password',
                    desc: 'Supabase sends an invite email. The invitee opens the link and sets their own password.',
                  },
                  {
                    method: 'Manual account',
                    desc: 'Staff creates the account immediately with a temporary password. No email flow is sent.',
                  },
                ].map(({ method, desc }) => (
                  <li key={method} className="text-sm text-stone-600">
                    <p className="font-medium text-stone-950">{method}</p>
                    <p className="mt-0.5 leading-5">{desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}
