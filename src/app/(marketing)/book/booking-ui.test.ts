import { describe, expect, it } from 'vitest';

import {
  booking_action_label,
  build_date_pill_range,
  is_slot_full,
  is_slot_in_past,
  slot_is_selectable,
  success_banner_title,
} from '@/app/(marketing)/book/booking-ui';

describe('booking-ui helpers', () => {
  it('does not allow selecting past, full, or recurring-reserved slots', () => {
    expect(slot_is_selectable(false, false, true)).toBe(true);
    expect(slot_is_selectable(true, false, true)).toBe(false);
    expect(slot_is_selectable(false, true, true)).toBe(false);
    expect(slot_is_selectable(false, false, false)).toBe(false);
  });

  it('detects full slots from confirmed counts', () => {
    expect(
      is_slot_full({
        slot_start: '09:00',
        slot_end: '10:00',
        session_id: 's1',
        confirmed_count: 6,
        capacity: 6,
        open_for_public_booking: true,
      }),
    ).toBe(true);
  });

  it('detects past slots', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date_key = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    expect(is_slot_in_past(date_key, '23:59', Date.now())).toBe(true);
  });

  it('uses confirmed booking labels only', () => {
    expect(booking_action_label(false)).toBe('Confirm booking');
    expect(booking_action_label(true)).toBe('Booking…');
    expect(success_banner_title()).toBe('Booking confirmed');
  });

  it('builds a 14-day pill range from the anchor week', () => {
    const anchor = new Date('2026-07-08T12:00:00');
    const pills = build_date_pill_range(anchor);
    expect(pills).toHaveLength(14);
    expect(pills[0].getDay()).toBe(1);
  });
});
