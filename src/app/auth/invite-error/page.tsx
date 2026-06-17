import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { createPageMetadata } from '@/lib/metadata';

const REASONS: Record<string, string> = {
  link_expired:
    'That invite link has expired or was already used. Invite links are single-use, so ask the studio to send a fresh one.',
  no_auth_payload:
    'The invite callback did not receive a usable auth payload. This usually means the Supabase redirect URL or email template is not pointing at the expected app route.',
  unsupported_token_type:
    'The invite callback received an auth token type this app does not accept for invitations.',
  exchange_failed:
    'Supabase rejected the invite token. The link may be expired, already used, or pointed at the wrong callback URL.',
  session_missing:
    'The invite token was processed, but no invited-user session was established.',
};

export const metadata = createPageMetadata({
  title: 'Invite Link Error',
  description: 'The studio account invitation could not be completed.',
  path: '/auth/invite-error',
});

export default async function InviteErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason ?? 'exchange_failed';
  const message = REASONS[reason] ?? REASONS.exchange_failed;

  return (
    <Section className="bg-background">
      <Container>
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="rounded-md border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-red-700">
              Invite error
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-red-950">
              Invite link could not be completed
            </h1>
            <p className="mt-4 text-sm leading-6 text-red-800">{message}</p>
            <div className="mt-6">
              <Link
                className="text-sm font-medium text-red-900 underline underline-offset-4"
                href="/login"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
