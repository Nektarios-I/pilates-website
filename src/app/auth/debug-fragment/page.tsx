import { notFound } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { authDebugEnabled } from '@/lib/auth/debug';
import { createPageMetadata } from '@/lib/metadata';
import { DebugFragmentClient } from './debug-fragment-client';

export const metadata = createPageMetadata({
  title: 'Auth Fragment Debug',
  description: 'Temporary gated auth fragment diagnostics.',
  path: '/auth/debug-fragment',
});

export default function AuthDebugFragmentPage() {
  if (!authDebugEnabled()) notFound();

  return (
    <Section className="bg-background">
      <Container>
        <div className="mx-auto max-w-2xl py-12">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
            Auth debug
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Browser-visible auth payload
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            This page is inert unless AUTH_DEBUG is enabled. It is useful when Supabase sends
            tokens in a URL fragment because fragments are invisible to server Route Handlers.
          </p>
          <div className="mt-6">
            <DebugFragmentClient />
          </div>
        </div>
      </Container>
    </Section>
  );
}
