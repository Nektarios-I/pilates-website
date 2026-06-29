import { redirect } from 'next/navigation';

import {
  marketingEyebrowClass,
  marketingPageIntroClass,
  marketingPageTitleClass,
} from '@/components/ui/marketing-field-styles';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { authDebugEnabled } from '@/lib/auth/debug';
import { safe_auth_next_path } from '@/lib/auth/safe-auth-redirect';
import { createPageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

export const metadata = createPageMetadata({
  title: 'Login',
  description: 'Sign in to your account to book classes and manage your membership.',
  path: '/login',
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; hint?: string; next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Session handoff after client sign-in — see docs/auth-sign-in-flow.md
  if (user) {
    redirect(safe_auth_next_path(params.next));
  }

  return (
    <>
      <Section aria-labelledby="login-page-heading" className="bg-background">
        <Container>
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <p className={marketingEyebrowClass}>Account</p>
              <h1 className={marketingPageTitleClass} id="login-page-heading">
                Sign in
              </h1>
              <p className={marketingPageIntroClass}>
                Sign in with your email and password, or a one-time code.
              </p>
            </div>

            <div className="mt-10">
              <LoginForm
                debugEnabled={authDebugEnabled()}
                error={params.error}
                hint={params.hint}
                message={params.message}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-foreground/70">
                Don&apos;t have an account?{' '}
                <span className="font-medium text-foreground">
                  Contact the studio to get started.
                </span>
              </p>
              <p className="mt-2 text-xs text-foreground/60">
                This studio uses invite-only accounts for member security.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
