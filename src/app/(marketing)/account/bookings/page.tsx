import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { createPageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';

export const metadata = createPageMetadata({
  title: 'My Bookings',
  description: 'View your upcoming and past Pilates bookings.',
  path: '/account/bookings',
});

type BookingSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  session_type: string;
  location: string | null;
  credits_required: number;
  reformer_credits_required: number;
  mat_credits_required: number;
};

type BookingCharge = {
  class_type: string;
  credits_used: number;
};

type BookingRow = {
  id: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  credits_used: number;
  sessions: BookingSession | BookingSession[] | null;
  booking_credit_charges: BookingCharge[] | null;
};

function related_row<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function format_date(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function format_time(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function format_session_type(type: string) {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function credit_summary(booking: BookingRow, session: BookingSession) {
  const charges = booking.booking_credit_charges ?? [];
  if (charges.length > 0) {
    return charges
      .map((charge) => `${charge.credits_used} ${charge.class_type}`)
      .join(' + ');
  }

  if (session.reformer_credits_required > 0 || session.mat_credits_required > 0) {
    return [
      session.reformer_credits_required > 0
        ? `${session.reformer_credits_required} reformer`
        : null,
      session.mat_credits_required > 0 ? `${session.mat_credits_required} mat` : null,
    ]
      .filter(Boolean)
      .join(' + ');
  }

  return `${booking.credits_used} credit${booking.credits_used === 1 ? '' : 's'}`;
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const session = related_row(booking.sessions);
  if (!session) return null;

  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            {format_date(session.starts_at)}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">{session.title}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {format_session_type(session.session_type)} · {format_time(session.starts_at)} -{' '}
            {format_time(session.ends_at)}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {booking.status}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-stone-500">Credits</dt>
          <dd className="mt-1 font-medium text-stone-950">{credit_summary(booking, session)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Booked</dt>
          <dd className="mt-1 font-medium text-stone-950">{format_date(booking.booked_at)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Location</dt>
          <dd className="mt-1 font-medium text-stone-950">{session.location ?? 'Studio'}</dd>
        </div>
      </dl>

      {booking.cancelled_at ? (
        <p className="mt-4 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
          Cancelled {format_date(booking.cancelled_at)}
          {booking.cancellation_reason ? ` · ${booking.cancellation_reason}` : ''}
        </p>
      ) : null}
    </article>
  );
}

export default async function AccountBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      booked_at,
      cancelled_at,
      cancellation_reason,
      credits_used,
      sessions!inner (
        id,
        title,
        starts_at,
        ends_at,
        session_type,
        location,
        credits_required,
        reformer_credits_required,
        mat_credits_required
      ),
      booking_credit_charges (
        class_type,
        credits_used
      )
    `,
    )
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false })
    .limit(100);

  const bookings = ((data ?? []) as BookingRow[])
    .filter((booking) => related_row(booking.sessions))
    .sort((a, b) => {
      const a_session = related_row(a.sessions);
      const b_session = related_row(b.sessions);
      return (
        new Date(a_session?.starts_at ?? 0).getTime() -
        new Date(b_session?.starts_at ?? 0).getTime()
      );
    });

  const now = new Date().getTime();
  const upcoming = bookings.filter((booking) => {
    const session = related_row(booking.sessions);
    return (
      session &&
      new Date(session.starts_at).getTime() >= now &&
      ['booked', 'waitlisted'].includes(booking.status)
    );
  });
  const history = bookings
    .filter((booking) => !upcoming.some((upcoming_booking) => upcoming_booking.id === booking.id))
    .reverse();

  return (
    <>
      <Section className="bg-background">
        <Container>
          <Link
            className="inline-flex min-h-11 items-center text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-950"
            href="/account"
          >
            Back to account
          </Link>
          <div className="mt-8 max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Account
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-stone-950 sm:text-5xl">
              My bookings
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              A clear overview of your scheduled classes and booking history.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-10">
              <section aria-labelledby="upcoming-bookings-heading">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      className="text-2xl font-semibold text-stone-950"
                      id="upcoming-bookings-heading"
                    >
                      Upcoming
                    </h2>
                    <p className="mt-1 text-sm text-stone-600">
                      Your next confirmed and waitlisted classes.
                    </p>
                  </div>
                  <ButtonLink href="/book" variant="secondary">
                    Book class
                  </ButtonLink>
                </div>

                <div className="mt-5 space-y-4">
                  {upcoming.length > 0 ? (
                    upcoming.map((booking) => <BookingCard booking={booking} key={booking.id} />)
                  ) : (
                    <div className="rounded-lg border border-border bg-surface p-8 text-center">
                      <p className="text-sm text-stone-600">No upcoming bookings.</p>
                    </div>
                  )}
                </div>
              </section>

              <section aria-labelledby="booking-history-heading">
                <h2 className="text-2xl font-semibold text-stone-950" id="booking-history-heading">
                  History
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Past, cancelled, attended, and waitlisted records.
                </p>

                <div className="mt-5 space-y-4">
                  {history.length > 0 ? (
                    history.map((booking) => <BookingCard booking={booking} key={booking.id} />)
                  ) : (
                    <div className="rounded-lg border border-border bg-surface p-8 text-center">
                      <p className="text-sm text-stone-600">No booking history yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-stone-950">At a glance</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Upcoming</dt>
                  <dd className="font-medium text-stone-950">{upcoming.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Total records</dt>
                  <dd className="font-medium text-stone-950">{bookings.length}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
