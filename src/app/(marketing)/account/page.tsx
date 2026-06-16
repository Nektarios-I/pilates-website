import { redirect } from 'next/navigation';

import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { createPageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';
import { AccountContent } from './account-content';

export const metadata = createPageMetadata({
  title: 'Account',
  description: 'Manage your account, view your packages, and access your booking history.',
  path: '/account',
});

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This should not happen due to middleware protection, but handle defensively
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile from database
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Fetch user roles
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);

  // Fetch active packages with remaining credits
  const { data: active_packages } = await supabase
    .from('user_packages')
    .select(
      `
      id,
      credits_remaining,
      starts_at,
      expires_at,
      status,
      packages (
        id,
        name,
        package_type
      )
    `,
    )
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Fetch upcoming bookings
  const { data: upcoming_bookings } = await supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      created_at,
      sessions (
        id,
        title,
        starts_at,
        ends_at,
        session_type,
        location
      )
    `,
    )
    .eq('user_id', user.id)
    .in('status', ['booked', 'waitlisted'])
    .gte('sessions.starts_at', new Date().toISOString())
    .order('sessions.starts_at', { ascending: true })
    .limit(5);

  return (
    <>
      <Section aria-labelledby="account-page-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Account
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="account-page-heading"
            >
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              Manage your profile, view your packages, and access your bookings.
            </p>
          </div>
        </Container>
      </Section>

      <AccountContent
        active_packages={active_packages || []}
        profile={profile}
        roles={roles || []}
        upcoming_bookings={upcoming_bookings || []}
        user={user}
      />

      <Section className="bg-muted">
        <Container>
          <div className="max-w-3xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/book">Book a class</ButtonLink>
              <ButtonLink href="/pricing" variant="secondary">
                View pricing
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
