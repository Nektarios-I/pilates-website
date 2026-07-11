import { describe, expect, it } from 'vitest';

import {
  build_day_bookings_sessions,
  filter_sessions_with_bookings,
  group_day_bookings_from_rows,
  is_active_booking_status,
  is_cancelled_booking_status,
  map_day_booking_attendee,
  map_day_session_row,
  session_starts_in_hour_range,
  summarize_day_bookings,
} from './day-bookings';

describe('day booking helpers', () => {
  it('session_starts_in_hour_range respects studio-local session start', () => {
    expect(
      session_starts_in_hour_range('2026-06-25T05:00:00.000Z', '08:00', '10:00'),
    ).toBe(true);
    expect(
      session_starts_in_hour_range('2026-06-25T05:00:00.000Z', '09:00', '10:00'),
    ).toBe(false);
  });

  it('classifies active and cancelled booking statuses', () => {
    expect(is_active_booking_status('booked')).toBe(true);
    expect(is_active_booking_status('waitlisted')).toBe(true);
    expect(is_cancelled_booking_status('cancelled')).toBe(true);
    expect(is_cancelled_booking_status('no_show')).toBe(true);
  });

  it('map_day_booking_attendee normalizes joined profile rows', () => {
    const mapped = map_day_booking_attendee({
      id: 'booking-1',
      status: 'booked',
      booked_at: '2026-06-20T09:00:00.000Z',
      cancelled_at: null,
      session_id: 'session-1',
      profiles: { full_name: 'Maria Papadou', email: 'maria@example.com' },
    });

    expect(mapped).toEqual({
      id: 'booking-1',
      status: 'booked',
      client_name: 'Maria Papadou',
      client_email: 'maria@example.com',
      client_phone: null,
      booked_at: '2026-06-20T09:00:00.000Z',
      cancelled_at: null,
    });
  });

  it('map_day_session_row reads instructor name', () => {
    const mapped = map_day_session_row({
      id: 'session-1',
      title: 'Morning Reformer',
      starts_at: '2026-06-25T08:00:00.000Z',
      ends_at: '2026-06-25T09:00:00.000Z',
      session_type: 'reformer',
      location: 'Studio A',
      instructor: { full_name: 'Panayiota' },
    });

    expect(mapped.instructor_name).toBe('Panayiota');
  });

  it('build_day_bookings_sessions splits active and cancelled attendees', () => {
    const sessions = [
      map_day_session_row({
        id: 'session-1',
        title: 'Morning Reformer',
        starts_at: '2026-06-25T08:00:00.000Z',
        ends_at: '2026-06-25T09:00:00.000Z',
        session_type: 'reformer',
        location: 'Studio A',
        instructor: { full_name: 'Panayiota' },
      }),
    ];

    const active = map_day_booking_attendee({
      id: 'active-1',
      status: 'booked',
      booked_at: '2026-06-20T09:00:00.000Z',
      cancelled_at: null,
      session_id: 'session-1',
      profiles: { full_name: 'Maria', email: 'maria@example.com' },
    })!;
    const cancelled = map_day_booking_attendee({
      id: 'cancelled-1',
      status: 'cancelled',
      booked_at: '2026-06-19T09:00:00.000Z',
      cancelled_at: '2026-06-20T10:00:00.000Z',
      session_id: 'session-1',
      profiles: { full_name: 'Alex', email: 'alex@example.com' },
    })!;

    const grouped = build_day_bookings_sessions(
      sessions,
      new Map([
        ['session-1', [active, cancelled]],
      ]),
    );

    expect(grouped[0]?.active_bookings).toHaveLength(1);
    expect(grouped[0]?.cancelled_bookings).toHaveLength(1);
    expect(summarize_day_bookings(grouped)).toEqual({
      sessions: 1,
      active: 1,
      cancelled: 1,
    });
  });

  it('filter_sessions_with_bookings hides empty parallel slots', () => {
    const with_booking = build_day_bookings_sessions(
      [
        map_day_session_row({
          id: 'reformer-1',
          title: 'Reformer · 01 Jul 06:00',
          starts_at: '2026-06-25T05:00:00.000Z',
          ends_at: '2026-06-25T06:00:00.000Z',
          session_type: 'reformer',
          location: 'Studio',
          instructor: null,
        }),
        map_day_session_row({
          id: 'mat-1',
          title: 'Mat · 01 Jul 06:00',
          starts_at: '2026-06-25T05:00:00.000Z',
          ends_at: '2026-06-25T06:00:00.000Z',
          session_type: 'mat',
          location: 'Studio',
          instructor: null,
        }),
      ],
      new Map([
        [
          'reformer-1',
          [
            map_day_booking_attendee({
              id: 'booking-1',
              status: 'booked',
              booked_at: '2026-06-20T09:00:00.000Z',
              cancelled_at: null,
              session_id: 'reformer-1',
              profiles: { full_name: 'Test', email: 'test@example.com' },
            })!,
          ],
        ],
      ]),
    );

    const visible = filter_sessions_with_bookings(with_booking);

    expect(visible).toHaveLength(1);
    expect(visible[0]?.session_type).toBe('reformer');
  });

  it('group_day_bookings_from_rows dedupes by session id', () => {
    const grouped = group_day_bookings_from_rows([
      {
        id: 'booking-1',
        status: 'booked',
        booked_at: '2026-06-20T09:00:00.000Z',
        cancelled_at: null,
        session_id: 'session-1',
        profiles: { full_name: 'Test', email: 'test@example.com' },
        sessions: {
          id: 'session-1',
          title: 'Reformer · 01 Jul 06:00',
          starts_at: '2026-06-25T05:00:00.000Z',
          ends_at: '2026-06-25T06:00:00.000Z',
          session_type: 'reformer',
          location: 'Studio',
          instructor: null,
        },
      },
      {
        id: 'booking-1',
        status: 'booked',
        booked_at: '2026-06-20T09:00:00.000Z',
        cancelled_at: null,
        session_id: 'session-1',
        profiles: { full_name: 'Test', email: 'test@example.com' },
        sessions: {
          id: 'session-1',
          title: 'Reformer · 01 Jul 06:00',
          starts_at: '2026-06-25T05:00:00.000Z',
          ends_at: '2026-06-25T06:00:00.000Z',
          session_type: 'reformer',
          location: 'Studio',
          instructor: null,
        },
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.active_bookings).toHaveLength(1);
  });
});
