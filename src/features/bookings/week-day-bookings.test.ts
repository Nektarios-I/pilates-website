import { describe, expect, it } from 'vitest';

import type { DayBookingsSession } from './day-bookings';
import {
  build_week_sessions_overview,
  format_session_count_label,
  format_week_range_label,
  monday_date_key_for,
  shift_date_key_by_days,
  studio_week_window_bounds,
  week_date_keys,
} from './week-day-bookings';

function session(partial: Partial<DayBookingsSession> & Pick<DayBookingsSession, 'id' | 'starts_at' | 'ends_at'>): DayBookingsSession {
  return {
    title: 'TEST TEST',
    session_type: 'reformer',
    location: 'Studio',
    instructor_name: null,
    capacity: 4,
    active_bookings: [
      {
        id: `booking-${partial.id}`,
        status: 'booked',
        client_name: 'Client',
        client_email: 'c@example.com',
        client_phone: null,
        booked_at: '2026-07-01T00:00:00.000Z',
        cancelled_at: null,
      },
    ],
    cancelled_bookings: [],
    ...partial,
  };
}

describe('week day bookings foundation', () => {
  it('monday_date_key_for returns Monday for mid-week and Sunday anchors', () => {
    expect(monday_date_key_for('2026-08-05')).toBe('2026-08-03');
    expect(monday_date_key_for('2026-08-09')).toBe('2026-08-03');
    expect(monday_date_key_for('2026-08-03')).toBe('2026-08-03');
  });

  it('week_date_keys returns Monday through Sunday', () => {
    expect(week_date_keys('2026-08-03')).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]);
  });

  it('handles cross-month and cross-year week boundaries', () => {
    expect(week_date_keys(monday_date_key_for('2026-08-01'))).toEqual([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ]);

    expect(week_date_keys(monday_date_key_for('2027-01-01'))).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('studio_week_window_bounds matches day-window naive local strings', () => {
    expect(studio_week_window_bounds('2026-08-03')).toEqual({
      week_start: '2026-08-03T00:00:00',
      week_end: '2026-08-09T23:59:59',
    });
  });

  it('format_week_range_label covers same-month, cross-month, and cross-year', () => {
    expect(format_week_range_label('2026-08-03')).toBe('3–9 August 2026');
    expect(format_week_range_label('2026-07-27')).toBe('27 July – 2 August 2026');
    expect(format_week_range_label('2026-12-28')).toBe('28 December 2026 – 3 January 2027');
  });

  it('shift_date_key_by_days moves exactly by calendar days', () => {
    expect(shift_date_key_by_days('2026-08-05', -7)).toBe('2026-07-29');
    expect(shift_date_key_by_days('2026-08-05', 7)).toBe('2026-08-12');
  });

  it('format_session_count_label uses singular, plural, and empty copy', () => {
    expect(format_session_count_label(0)).toBe('No sessions');
    expect(format_session_count_label(1)).toBe('1 session');
    expect(format_session_count_label(4)).toBe('4 sessions');
  });

  it('build_week_sessions_overview fills seven days and groups exact time slots chronologically', () => {
    const overview = build_week_sessions_overview({
      monday_key: '2026-08-03',
      sessions: [
        session({
          id: 's-late',
          title: 'Evening Mat',
          session_type: 'mat',
          // 17:30–18:30 Europe/Nicosia (EEST = UTC+3 in August)
          starts_at: '2026-08-03T14:30:00.000Z',
          ends_at: '2026-08-03T15:30:00.000Z',
        }),
        session({
          id: 's-early',
          title: 'TEST TEST',
          session_type: 'reformer',
          // 06:00–07:00 Europe/Nicosia
          starts_at: '2026-08-03T03:00:00.000Z',
          ends_at: '2026-08-03T04:00:00.000Z',
        }),
        session({
          id: 's-parallel',
          title: 'Mat Parallel',
          session_type: 'mat',
          starts_at: '2026-08-03T03:00:00.000Z',
          ends_at: '2026-08-03T04:00:00.000Z',
        }),
        session({
          id: 's-tue',
          title: 'Tuesday Reformer',
          session_type: 'reformer',
          starts_at: '2026-08-04T06:00:00.000Z',
          ends_at: '2026-08-04T07:00:00.000Z',
        }),
      ],
      today_key: '2026-08-05',
    });

    expect(overview.days).toHaveLength(7);
    expect(overview.total_sessions).toBe(4);
    expect(overview.days[0]?.session_count).toBe(3);
    expect(overview.days[0]?.slots).toHaveLength(2);
    expect(overview.days[0]?.slots[0]?.time_label).toBe('06:00–07:00');
    expect(overview.days[0]?.slots[0]?.session_count).toBe(2);
    expect(overview.days[0]?.slots[0]?.sessions.map((row) => row.title)).toEqual([
      'TEST TEST',
      'Mat Parallel',
    ]);
    expect(overview.days[0]?.slots[0]?.attendees).toEqual([
      {
        id: 'booking-s-parallel',
        client_name: 'Client',
        session_type: 'mat',
        session_type_label: 'Mat',
      },
      {
        id: 'booking-s-early',
        client_name: 'Client',
        session_type: 'reformer',
        session_type_label: 'Reformer',
      },
    ]);
    expect(overview.days[0]?.slots[1]?.time_label).toBe('17:30–18:30');
    expect(overview.days[1]?.session_count).toBe(1);
    expect(overview.days[2]?.is_today).toBe(true);
    expect(overview.days[2]?.session_count).toBe(0);
    expect(overview.days[2]?.slots).toEqual([]);
  });

  it('counts active bookings as sessions and ignores cancelled-only class sessions', () => {
    const overview = build_week_sessions_overview({
      monday_key: '2026-07-27',
      today_key: '2026-07-29',
      sessions: [
        session({
          id: 'wed-shared',
          // 18:00–19:00 Europe/Nicosia
          starts_at: '2026-07-29T15:00:00.000Z',
          ends_at: '2026-07-29T16:00:00.000Z',
          active_bookings: [
            {
              id: 'myria',
              status: 'booked',
              client_name: 'MYRIA STAVROU',
              client_email: 'myria@example.com',
              client_phone: null,
              booked_at: '2026-07-01T00:00:00.000Z',
              cancelled_at: null,
            },
            {
              id: 'sofia',
              status: 'booked',
              client_name: 'SOFIA MANOLI',
              client_email: 'sofia@example.com',
              client_phone: null,
              booked_at: '2026-07-01T00:00:00.000Z',
              cancelled_at: null,
            },
          ],
        }),
        session({
          id: 'fri-cancelled-only',
          // 06:00–07:00 Europe/Nicosia
          starts_at: '2026-07-31T03:00:00.000Z',
          ends_at: '2026-07-31T04:00:00.000Z',
          active_bookings: [],
          cancelled_bookings: [
            {
              id: 'cancelled-1',
              status: 'cancelled',
              client_name: 'Cancelled Client',
              client_email: 'c@example.com',
              client_phone: null,
              booked_at: '2026-07-01T00:00:00.000Z',
              cancelled_at: '2026-07-30T00:00:00.000Z',
            },
          ],
        }),
      ],
    });

    const wednesday = overview.days.find((day) => day.date_key === '2026-07-29');
    expect(wednesday?.session_count).toBe(2);
    expect(wednesday?.slots).toHaveLength(1);
    expect(wednesday?.slots[0]?.session_count).toBe(2);
    expect(wednesday?.slots[0]?.attendees.map((row) => row.client_name)).toEqual([
      'MYRIA STAVROU',
      'SOFIA MANOLI',
    ]);

    const friday = overview.days.find((day) => day.date_key === '2026-07-31');
    expect(friday?.session_count).toBe(0);
    expect(friday?.slots).toEqual([]);
  });

  it('build_week_sessions_overview places sessions on the studio-local calendar day', () => {
    // 22:00 Tuesday Europe/Nicosia = 19:00Z Tuesday; still Tuesday locally
    const overview = build_week_sessions_overview({
      monday_key: '2026-08-03',
      sessions: [
        session({
          id: 's-late-tue',
          starts_at: '2026-08-04T19:00:00.000Z',
          ends_at: '2026-08-04T20:00:00.000Z',
        }),
      ],
      today_key: '2026-08-03',
    });

    expect(overview.days[1]?.date_key).toBe('2026-08-04');
    expect(overview.days[1]?.session_count).toBe(1);
    expect(overview.days[0]?.session_count).toBe(0);
  });
});
