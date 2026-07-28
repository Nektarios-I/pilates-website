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
  profiles: { full_name: 'Maria Papadou', email: 'maria@example.com', phone: '+357 99 000000' },
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
      client_phone: '+357 99 000000',
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

  it('filter_staff_bookings_by_search matches client name, email, or phone', () => {
    const mapped = map_staff_booking(sample_row)!;

    expect(filter_staff_bookings_by_search([mapped], 'maria')).toHaveLength(1);
    expect(filter_staff_bookings_by_search([mapped], 'papadou')).toHaveLength(1);
    expect(filter_staff_bookings_by_search([mapped], 'example.com')).toHaveLength(1);
    expect(filter_staff_bookings_by_search([mapped], '99000000')).toHaveLength(1);
    expect(filter_staff_bookings_by_search([mapped], 'unknown')).toHaveLength(0);
  });

  it('map_staff_booking maps a finished booking with client name', () => {
    const mapped = map_staff_booking({
      ...sample_row,
      status: 'finished',
      profiles: {
        full_name: 'MARIA ERAKLEOUS',
        email: 'mariaerakleous6@iclous.com',
        phone: null,
      },
      sessions: {
        ...sample_row.sessions,
        title: 'Reformer · 30 Jul 19:00',
        starts_at: '2026-07-30T16:00:00.000Z',
        ends_at: '2026-07-30T17:00:00.000Z',
      },
    });

    expect(mapped).toMatchObject({
      status: 'finished',
      client_name: 'MARIA ERAKLEOUS',
      session_title: 'Reformer · 30 Jul 19:00',
      session_starts_at: '2026-07-30T16:00:00.000Z',
    });
  });

  it('map_staff_booking keeps rows when email is missing but phone is present', () => {
    const mapped = map_staff_booking({
      ...sample_row,
      profiles: { full_name: 'MARIA PAPADOPOULOU', email: null, phone: '+357 99 123 456' },
    });

    expect(mapped?.client_email).toBeNull();
    expect(mapped?.client_phone).toBe('+357 99 123 456');
  });

  it('format_booking_status humanizes values', () => {
    expect(format_booking_status('no_show')).toBe('No Show');
    expect(format_booking_status('waitlisted')).toBe('Waitlisted');
    expect(format_booking_status('finished')).toBe('Finished');
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
