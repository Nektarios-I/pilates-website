import { describe, expect, it } from 'vitest';

import {
  filter_staff_bookings_by_search,
  format_booking_status,
  format_staff_booking_history_status,
  is_valid_session_date_range,
  map_staff_booking,
  sort_staff_bookings_by_session_start,
} from './staff-bookings';

const sample_row = {
  id: 'booking-1',
  status: 'booked',
  booked_at: '2026-06-20T09:00:00.000Z',
  cancelled_at: null,
  cancellation_reason: null,
  credits_used: 1,
  profiles: { full_name: 'Maria Papadou', email: 'maria@example.com' },
  sessions: {
    title: 'Morning Reformer',
    starts_at: '2026-06-25T08:00:00.000Z',
    ends_at: '2026-06-25T09:00:00.000Z',
    session_type: 'reformer',
    location: 'Studio A',
    credits_required: 1,
    reformer_credits_required: 1,
    mat_credits_required: 0,
  },
  booking_credit_charges: [{ class_type: 'reformer', credits_used: 1 }],
};

describe('staff booking helpers', () => {
  it('map_staff_booking normalizes joined rows', () => {
    const mapped = map_staff_booking(sample_row);

    expect(mapped).toEqual({
      id: 'booking-1',
      status: 'booked',
      booked_at: '2026-06-20T09:00:00.000Z',
      cancelled_at: null,
      cancellation_reason: null,
      credits_used: 1,
      client_name: 'Maria Papadou',
      client_email: 'maria@example.com',
      session_title: 'Morning Reformer',
      session_starts_at: '2026-06-25T08:00:00.000Z',
      session_ends_at: '2026-06-25T09:00:00.000Z',
      session_type: 'reformer',
      session_location: 'Studio A',
      credit_charges: [{ class_type: 'reformer', credits_used: 1 }],
    });
  });

  it('map_staff_booking returns null when session or profile is missing', () => {
    expect(map_staff_booking({ ...sample_row, sessions: null })).toBeNull();
    expect(map_staff_booking({ ...sample_row, profiles: null })).toBeNull();
  });

  it('sort_staff_bookings_by_session_start orders newest session first by default', () => {
    const earlier = map_staff_booking({
      ...sample_row,
      id: 'earlier',
      sessions: {
        ...sample_row.sessions,
        starts_at: '2026-06-24T08:00:00.000Z',
      },
    })!;
    const later = map_staff_booking({
      ...sample_row,
      id: 'later',
      sessions: {
        ...sample_row.sessions,
        starts_at: '2026-06-26T08:00:00.000Z',
      },
    })!;

    const sorted = sort_staff_bookings_by_session_start([earlier, later]);

    expect(sorted.map((row) => row.id)).toEqual(['later', 'earlier']);
  });

  it('filter_staff_bookings_by_search matches client name or email', () => {
    const mapped = map_staff_booking(sample_row)!;

    expect(filter_staff_bookings_by_search([mapped], 'maria')).toHaveLength(1);
    expect(filter_staff_bookings_by_search([mapped], 'papadou')).toHaveLength(1);
    expect(filter_staff_bookings_by_search([mapped], 'example.com')).toHaveLength(1);
    expect(filter_staff_bookings_by_search([mapped], 'unknown')).toHaveLength(0);
  });

  it('format_booking_status humanizes values', () => {
    expect(format_booking_status('no_show')).toBe('No Show');
    expect(format_booking_status('waitlisted')).toBe('Waitlisted');
  });

  it('format_staff_booking_history_status labels filter options', () => {
    expect(format_staff_booking_history_status('all')).toBe('All statuses');
    expect(format_staff_booking_history_status('finished')).toBe('Finished');
    expect(format_staff_booking_history_status('booked')).toBe('Booked');
  });

  it('is_valid_session_date_range accepts empty or ordered dates', () => {
    expect(is_valid_session_date_range('', '')).toBe(true);
    expect(is_valid_session_date_range('2026-06-01', '')).toBe(true);
    expect(is_valid_session_date_range('2026-06-01', '2026-06-30')).toBe(true);
    expect(is_valid_session_date_range('2026-06-30', '2026-06-01')).toBe(false);
  });
});
