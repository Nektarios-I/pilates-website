import { redirect } from 'next/navigation';

import { ButtonLink } from '@/components/ui/button-link';
import {
  marketingEyebrowClass,
  marketingPageIntroClass,
  marketingPageTitleClass,
} from '@/components/ui/marketing-field-styles';
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

  // Fetch client packages; effective lifecycle filtering happens in AccountContent
  const { data: package_rows } = await supabase
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
        class_type,
        package_type
      )
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch upcoming bookings
  const { data: booking_rows } = await supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      created_at,
      sessions!inner (
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
    .order('created_at', { ascending: false })
    .limit(50);

  const current_time = new Date().getTime();
  const upcoming_bookings = (booking_rows ?? [])
    .filter((booking) => {
      const session = Array.isArray(booking.sessions) ? booking.sessions[0] : booking.sessions;
      return session ? new Date(session.starts_at).getTime() >= current_time : false;
    })
    .sort((a, b) => {
      const a_session = Array.isArray(a.sessions) ? a.sessions[0] : a.sessions;
      const b_session = Array.isArray(b.sessions) ? b.sessions[0] : b.sessions;
      return (
        new Date(a_session?.starts_at ?? 0).getTime() -
        new Date(b_session?.starts_at ?? 0).getTime()
      );
    })
    .slice(0, 5);

  const { data: planned_slot_rows } = await supabase.rpc('get_my_recurring_planned_slots');

  const planned_slots = (planned_slot_rows ?? []).map(
    (row: {
      rule_id: string;
      rule_label: string;
      session_card_title: string;
      occurrence_date: string;
      start_time: string;
      occurrence_starts_at: string;
      occurrence_ends_at: string;
      booking_state: string;
      token_health: string | null;
      failure_message: string | null;
    }) => ({
      rule_id: row.rule_id,
      rule_label: row.rule_label,
      session_card_title: row.session_card_title,
      occurrence_date: row.occurrence_date,
      start_time: row.start_time,
      occurrence_starts_at: row.occurrence_starts_at,
      occurrence_ends_at: row.occurrence_ends_at,
      booking_state: row.booking_state,
      token_health: row.token_health,
      failure_message: row.failure_message,
    }),
  );

  return (
    <>
      <Section aria-labelledby="account-page-heading" className="bg-background">
        <Container>
          <div className="max-w-3xl">
            <p className={marketingEyebrowClass}>Account</p>
            <h1 className={marketingPageTitleClass} id="account-page-heading">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className={`${marketingPageIntroClass} text-lg`}>
              Manage your profile, view your packages, and access your bookings.
            </p>
          </div>
        </Container>
      </Section>

      <AccountContent
        packages={package_rows || []}
        planned_slots={planned_slots}
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
