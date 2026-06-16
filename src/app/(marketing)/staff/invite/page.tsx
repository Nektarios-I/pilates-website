import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { createPageMetadata } from '@/lib/metadata';

import { InviteForm } from './invite-form';

export const metadata = createPageMetadata({
  title: 'Create Account Invitation',
  description: 'Invite a new team member or client to the studio platform.',
  path: '/staff/invite',
});

export default function StaffInvitePage() {
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
            <InviteForm />
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
                    method: 'Magic link',
                    desc: 'A secure email link signs the user in directly. No password is created.',
                  },
                  {
                    method: 'Email OTP',
                    desc: 'A one-time code is sent. The user enters it to verify their identity.',
                  },
                  {
                    method: 'Manual registration',
                    desc: 'Staff creates the record now. The invitee completes their profile setup later.',
                  },
                ].map(({ method, desc }) => (
                  <li key={method} className="text-sm text-stone-600">
                    <p className="font-medium text-stone-950">{method}</p>
                    <p className="mt-0.5 leading-5">{desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Development note
              </p>
              <p className="mt-1.5 text-sm leading-5 text-amber-700">
                This page uses a mock role. Change{' '}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">
                  MOCK_CURRENT_ROLE
                </code>{' '}
                in <code className="rounded bg-amber-100 px-1 font-mono text-xs">invite-form.tsx</code>{' '}
                to test different permission states.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}
