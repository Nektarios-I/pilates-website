import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { DEFAULT_DAY_BOOKINGS_FILTERS } from '@/features/bookings/day-bookings';
import { current_studio_year_month } from '@/features/bookings/month-calendar';
import { createPageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';

import { list_day_bookings, list_month_calendar, list_week_day_bookings } from './actions';
import { DayBookingsPanel } from './day-bookings-panel';

export const metadata = createPageMetadata({
  title: 'Day Bookings',
  description: 'Review member bookings for a chosen day and time range.',
  path: '/staff/day-bookings',
});

const TEACHING_STAFF_ROLES = ['instructor', 'owner', 'admin'] as const;

async function resolve_page_access(): Promise<{ allowed: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false };

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role_values = (roles ?? []).map((row) => row.role);
  const allowed = role_values.some((role) =>
    (TEACHING_STAFF_ROLES as readonly string[]).includes(role),
  );
  return { allowed };
}

export default async function StaffDayBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const access = await resolve_page_access();
  if (!access.allowed) redirect('/account');

  const studio_month = current_studio_year_month();
  const [day_result, week_result, month_result] = await Promise.all([
    list_day_bookings(DEFAULT_DAY_BOOKINGS_FILTERS),
    list_week_day_bookings(DEFAULT_DAY_BOOKINGS_FILTERS),
    list_month_calendar(studio_month.year, studio_month.month),
  ]);

  return (
    <Container>
      <div className="py-8 sm:py-12">
        <div className="mb-6">
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
            href="/account"
          >
            Back to account
          </Link>
        </div>

        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-foreground/60">
            Staff
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Day bookings
          </h1>
          <p className="mt-3 text-base leading-7 text-foreground/70">
            Choose a day and hour range to review who is booked into each session. Active and
            cancelled bookings are shown separately for quick studio operations.
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <DayBookingsPanel
            initial_error={day_result.error}
            initial_filters={DEFAULT_DAY_BOOKINGS_FILTERS}
            initial_sessions={day_result.sessions}
            initial_summary={day_result.summary}
            initial_week_error={week_result.error}
            initial_week_overview={week_result.overview}
            initial_month_error={month_result.error}
            initial_month_overview={month_result.overview}
          />
        </div>
      </div>
    </Container>
  );
}
