import type { ClientBookingRecord } from './types';

export type ClientBookingFilter = 'upcoming' | 'cancelled' | 'finished';

export function filter_client_bookings(
  bookings: ClientBookingRecord[],
  filter: ClientBookingFilter,
  now = Date.now(),
): ClientBookingRecord[] {
  if (filter === 'cancelled') {
    return bookings.filter((booking) => booking.status === 'cancelled');
  }

  if (filter === 'finished') {
    return bookings.filter((booking) => {
      if (booking.status === 'cancelled') return false;
      return new Date(booking.session_starts_at).getTime() < now;
    });
  }

  return bookings.filter(
    (booking) =>
      ['booked', 'waitlisted'].includes(booking.status) &&
      new Date(booking.session_starts_at).getTime() >= now,
  );
}

export function summarize_recurring_health(
  forecasts: { health_status: string | null }[],
): { ready: number; insufficient_tokens: number; failed: number } {
  return forecasts.reduce(
    (acc, row) => {
      if (row.health_status === 'ready') acc.ready += 1;
      if (row.health_status === 'insufficient_tokens') acc.insufficient_tokens += 1;
      if (row.health_status === 'failed') acc.failed += 1;
      return acc;
    },
    { ready: 0, insufficient_tokens: 0, failed: 0 },
  );
}
