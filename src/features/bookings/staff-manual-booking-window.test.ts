import { describe, expect, it } from 'vitest';

import {
  is_within_public_self_booking_window,
  is_within_staff_manual_booking_window,
  public_self_booking_horizon_days,
  staff_manual_booking_blocks_past_dates,
} from './staff-manual-booking-window';

describe('staff manual booking window', () => {
  const now = new Date('2026-08-06T10:00:00+03:00');

  it('allows staff to book today', () => {
    expect(is_within_staff_manual_booking_window('2026-08-06', now)).toBe(true);
  });

  it('allows staff to book more than two weeks ahead', () => {
    expect(is_within_staff_manual_booking_window('2026-08-25', now)).toBe(true);
    expect(is_within_staff_manual_booking_window('2026-12-01', now)).toBe(true);
  });

  it('blocks staff from booking past dates', () => {
    expect(is_within_staff_manual_booking_window('2026-08-05', now)).toBe(false);
    expect(staff_manual_booking_blocks_past_dates('2026-08-05', now)).toBe(true);
  });

  it('keeps public self-booking limited to the existing 14-day horizon', () => {
    expect(public_self_booking_horizon_days()).toBe(14);
    expect(is_within_public_self_booking_window('2026-08-20', now)).toBe(true);
    expect(is_within_public_self_booking_window('2026-08-21', now)).toBe(false);
  });
});
