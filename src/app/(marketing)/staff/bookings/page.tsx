import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { DEFAULT_STAFF_BOOKING_FILTERS } from '@/features/bookings/staff-bookings';
import { createPageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';

import { list_staff_bookings } from './actions';
import { BookingHistoryPanel } from './booking-history-panel';

export const metadata = createPageMetadata({
  title: 'Booking History',
  description: 'Search and review client bookings across the studio schedule.',
  path: '/staff/bookings',
});

async function is_admin_or_owner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  return (roles ?? []).some((row) => row.role === 'owner' || row.role === 'admin');
}

export default async function StaffBookingHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (!(await is_admin_or_owner())) redirect('/account');

  const { bookings, error } = await list_staff_bookings(DEFAULT_STAFF_BOOKING_FILTERS);

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
            Owner / Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Booking history
          </h1>
          <p className="mt-3 text-base leading-7 text-foreground/70">
            Review client bookings across the studio schedule. Filter by status, session
            dates, or client name and email.
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <BookingHistoryPanel
            initial_bookings={bookings}
            initial_error={error}
            initial_filters={DEFAULT_STAFF_BOOKING_FILTERS}
          />
        </div>
      </div>
    </Container>
  );
}
