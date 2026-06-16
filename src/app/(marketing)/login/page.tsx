import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
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
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to account
  if (user) {
    redirect('/account');
  }

  return (
    <>
      <Section aria-labelledby="login-page-heading" className="bg-background">
        <Container>
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
                Account
              </p>
              <h1
                className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
                id="login-page-heading"
              >
                Sign in
              </h1>
              <p className="mt-5 text-base leading-7 text-stone-700">
                Enter your email to receive a secure sign-in link. No password required.
              </p>
            </div>

            <div className="mt-10">
              <LoginForm error={params.error} message={params.message} />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-stone-600">
                Don&apos;t have an account?{' '}
                <span className="font-medium text-stone-950">
                  Contact the studio to get started.
                </span>
              </p>
              <p className="mt-2 text-xs text-stone-500">
                This studio uses invite-only accounts for member security.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
