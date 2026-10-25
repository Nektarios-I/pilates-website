import { group_client_booking } from '@/features/bookings/not-attended';
import type { ClientBookingRecord } from './types';

export type ClientBookingFilter =
  | 'upcoming'
  | 'in_progress'
  | 'finished'
  | 'cancelled'
  | 'no_show'
  | 'not_attended';

export function filter_client_bookings(
  bookings: ClientBookingRecord[],
  filter: ClientBookingFilter,
  now = Date.now(),
): ClientBookingRecord[] {
  const now_date = new Date(now);
  return bookings.filter((booking) => {
    const group = group_client_booking({
      status: booking.status,
      session_starts_at: booking.session_starts_at,
      session_ends_at: booking.session_ends_at || booking.session_starts_at,
      now: now_date,
    });
    return group === filter;
  });
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
