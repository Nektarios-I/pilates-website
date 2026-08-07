import { describe, expect, it } from 'vitest';

import { PUBLIC_BOOKING_HORIZON_DAYS } from '@/app/(marketing)/book/booking-ui';
import { staff_manual_book_session_core_flags } from '@/features/bookings/booking-rpc-contract';

/**
 * Feature 1 contract expectations.
 * staff_manual_book_session_core_flags.enforce_public_horizon must be false
 * so staff can book beyond the public 14-day window; public horizon stays 14.
 */
describe('Feature 1 — staff manual booking horizon contract', () => {
  it('documents that public self-booking horizon remains 14 days', () => {
    expect(PUBLIC_BOOKING_HORIZON_DAYS).toBe(14);
  });

  it('requires staff manual booking to disable the public horizon upper bound', () => {
    const flags = staff_manual_book_session_core_flags('staff-id');
    expect(flags.allow_waitlist).toBe(false);
    expect(flags.booking_source).toBe('staff_manual');
    expect(flags.enforce_public_horizon).toBe(false);
  });
});
