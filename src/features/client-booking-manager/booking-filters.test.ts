import { describe, expect, it } from 'vitest';

import {
  filter_client_bookings,
  summarize_recurring_health,
} from '@/features/client-booking-manager/booking-filters';
import type { ClientBookingRecord } from '@/features/client-booking-manager/types';

function booking(
  overrides: Partial<ClientBookingRecord> & Pick<ClientBookingRecord, 'id' | 'status' | 'session_starts_at'>,
): ClientBookingRecord {
  return {
    booked_at: '2026-07-01T10:00:00.000Z',
    cancelled_at: null,
    cancellation_reason: null,
    credits_used: 1,
    booking_source: 'client',
    session_id: 'session-1',
    session_title: 'Reformer Flow',
    session_ends_at: '2026-07-10T11:00:00.000Z',
    session_type: 'reformer',
    credit_charges: [],
    ...overrides,
  };
}

describe('filter_client_bookings', () => {
  const now = new Date('2026-07-10T12:00:00.000Z').getTime();
  const rows = [
    booking({ id: '1', status: 'booked', session_starts_at: '2026-07-11T10:00:00.000Z' }),
    booking({ id: '2', status: 'waitlisted', session_starts_at: '2026-07-12T10:00:00.000Z' }),
    booking({ id: '3', status: 'booked', session_starts_at: '2026-07-09T10:00:00.000Z' }),
    booking({ id: '4', status: 'cancelled', session_starts_at: '2026-07-13T10:00:00.000Z' }),
  ];

  it('returns upcoming booked and waitlisted sessions', () => {
    const result = filter_client_bookings(rows, 'upcoming', now);
    expect(result.map((row) => row.id)).toEqual(['1', '2']);
  });

  it('returns finished non-cancelled sessions', () => {
    const result = filter_client_bookings(rows, 'finished', now);
    expect(result.map((row) => row.id)).toEqual(['3']);
  });

  it('returns cancelled sessions', () => {
    const result = filter_client_bookings(rows, 'cancelled', now);
    expect(result.map((row) => row.id)).toEqual(['4']);
  });
});

describe('summarize_recurring_health', () => {
  it('counts forecast health statuses', () => {
    const summary = summarize_recurring_health([
      { health_status: 'ready' },
      { health_status: 'ready' },
      { health_status: 'insufficient_tokens' },
      { health_status: 'failed' },
      { health_status: null },
    ]);

    expect(summary).toEqual({ ready: 2, insufficient_tokens: 1, failed: 1 });
  });
});
