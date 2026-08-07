import { describe, expect, it } from 'vitest';

import {
  BOOKING_ERROR_CODES,
  PUBLIC_BOOK_SESSION_CORE_FLAGS,
  RECURRING_MATERIALIZATION_FLAGS,
  RECURRING_MATERIALIZATION_HORIZON_DAYS,
  STAFF_MATERIALIZE_PREVIEW_MONTHS,
  credits_deducted_for_status,
  map_postgres_booking_error,
  occurrence_within_materialization_window,
  occurrence_within_staff_materialize_preview,
  recurring_provenance_on_success,
  refund_applies_for_cancelled_status,
  staff_manual_book_session_core_flags,
  staff_may_cancel_booking,
  staff_may_view_packages_for_user,
} from './booking-rpc-contract';

describe('booking RPC contract — public path', () => {
  it('public core flags disable waitlist and keep client provenance', () => {
    expect(PUBLIC_BOOK_SESSION_CORE_FLAGS.allow_waitlist).toBe(false);
    expect(PUBLIC_BOOK_SESSION_CORE_FLAGS.enforce_public_horizon).toBe(true);
    expect(PUBLIC_BOOK_SESSION_CORE_FLAGS.booking_source).toBe('client');
    expect(PUBLIC_BOOK_SESSION_CORE_FLAGS.created_by_user_id).toBeNull();
    expect(PUBLIC_BOOK_SESSION_CORE_FLAGS.recurring_materialization_log_id).toBeNull();
  });

  it('credits deduct only for booked status, not waitlisted', () => {
    expect(credits_deducted_for_status('booked')).toBe(true);
    expect(credits_deducted_for_status('waitlisted')).toBe(false);
  });

  it('refund applies only when cancelling a booked row', () => {
    expect(refund_applies_for_cancelled_status('booked')).toBe(true);
    expect(refund_applies_for_cancelled_status('waitlisted')).toBe(false);
  });

  it('maps recurring priority P0032', () => {
    const result = map_postgres_booking_error('ERROR: P0032 reserved');
    expect(result.code).toBe(BOOKING_ERROR_CODES.recurring_priority);
    expect(result.friendly).toMatch(/recurring prebookings are processed/i);
  });

  it('maps 14-day horizon P0014', () => {
    const result = map_postgres_booking_error('ERROR: P0014 horizon');
    expect(result.code).toBe(BOOKING_ERROR_CODES.booking_horizon);
    expect(result.friendly).toMatch(/14 days/i);
  });
});

describe('booking RPC contract — staff manual path', () => {
  const staff_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('staff manual flags disable waitlist, skip public horizon upper bound, and set provenance', () => {
    const flags = staff_manual_book_session_core_flags(staff_id);
    expect(flags.allow_waitlist).toBe(false);
    expect(flags.enforce_public_horizon).toBe(false);
    expect(flags.booking_source).toBe('staff_manual');
    expect(flags.created_by_user_id).toBe(staff_id);
    expect(flags.recurring_materialization_log_id).toBeNull();
  });

  it('maps capacity full P0015 for public and staff booking', () => {
    const result = map_postgres_booking_error('ERROR: P0015 Session is at capacity');
    expect(result.code).toBe(BOOKING_ERROR_CODES.session_at_capacity);
    expect(result.friendly).toMatch(/full and cannot be booked/i);
  });

  it('maps cancellation cutoff P0029', () => {
    const result = map_postgres_booking_error('ERROR: P0029 cutoff');
    expect(result.code).toBe(BOOKING_ERROR_CODES.cancellation_cutoff);
    expect(result.friendly).toMatch(/4 hours before class/i);
  });

  it('staff may cancel another user booking when is_staff', () => {
    expect(staff_may_cancel_booking('staff-1', 'client-1', true)).toBe(true);
    expect(staff_may_cancel_booking('client-2', 'client-1', false)).toBe(false);
    expect(staff_may_cancel_booking('client-1', 'client-1', false)).toBe(true);
  });

  it('staff may view client packages when is_staff', () => {
    expect(staff_may_view_packages_for_user('staff-1', 'client-1', true)).toBe(true);
    expect(staff_may_view_packages_for_user('client-2', 'client-1', false)).toBe(false);
    expect(staff_may_view_packages_for_user('client-1', 'client-1', false)).toBe(true);
  });
});

describe('booking RPC contract — cancellation policy', () => {
  it('refund applies when cancelling a booked row outside cutoff', () => {
    expect(refund_applies_for_cancelled_status('booked')).toBe(true);
  });

  it('P0029 is defined for client cancellation cutoff', () => {
    expect(BOOKING_ERROR_CODES.cancellation_cutoff).toBe('P0029');
  });
});

describe('recurring prebook contract', () => {
  it('materialization cron uses 14-day rolling horizon constant', () => {
    expect(RECURRING_MATERIALIZATION_HORIZON_DAYS).toBe(14);
  });

  it('staff Materialize Now uses the three-calendar-month preview window', () => {
    expect(STAFF_MATERIALIZE_PREVIEW_MONTHS).toBe(3);
    expect(
      occurrence_within_staff_materialize_preview('2026-08-24', '2026-08-24', '2026-08-06'),
    ).toBe(true);
    expect(
      occurrence_within_staff_materialize_preview('2026-11-23', '2026-08-24', '2026-08-06'),
    ).toBe(true);
    expect(
      occurrence_within_staff_materialize_preview('2026-11-30', '2026-08-24', '2026-08-06'),
    ).toBe(false);
    expect(
      occurrence_within_staff_materialize_preview('2026-08-10', '2026-08-24', '2026-08-06'),
    ).toBe(false);
  });

  it('recurring flags disable waitlist and use recurring provenance', () => {
    expect(RECURRING_MATERIALIZATION_FLAGS.allow_waitlist).toBe(false);
    expect(RECURRING_MATERIALIZATION_FLAGS.booking_source).toBe('recurring');
    expect(RECURRING_MATERIALIZATION_FLAGS.created_by_user_id).toBeNull();
  });

  it('occurrence_within_materialization_window respects inclusive 14-day window', () => {
    expect(occurrence_within_materialization_window('2026-07-08', '2026-07-08')).toBe(true);
    expect(occurrence_within_materialization_window('2026-07-22', '2026-07-08')).toBe(true);
    expect(occurrence_within_materialization_window('2026-07-23', '2026-07-08')).toBe(false);
  });

  it('recurring_provenance_on_success links log id with null staff actor', () => {
    const log_id = '11111111-2222-3333-4444-555555555555';
    expect(recurring_provenance_on_success(log_id)).toEqual({
      booking_source: 'recurring',
      created_by_user_id: null,
      recurring_materialization_log_id: log_id,
    });
  });

  it('materialization failure does not create waitlist bookings', () => {
    expect(RECURRING_MATERIALIZATION_FLAGS.allow_waitlist).toBe(false);
    expect(credits_deducted_for_status('waitlisted')).toBe(false);
  });
});
