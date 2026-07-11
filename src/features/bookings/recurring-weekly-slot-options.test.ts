import { describe, expect, it } from 'vitest';

import {
  build_recurring_weekly_slot_options,
  is_valid_recurring_weekly_slot,
} from '@/features/bookings/recurring-weekly-slot-options';

describe('recurring-weekly-slot-options', () => {
  it('returns hourly slots for each weekday from default studio hours', () => {
    const options = build_recurring_weekly_slot_options(60);

    const monday = options.find((day) => day.day_of_week === 1);
    const wednesday = options.find((day) => day.day_of_week === 3);
    const saturday = options.find((day) => day.day_of_week === 6);
    const sunday = options.find((day) => day.day_of_week === 7);

    expect(monday?.is_closed).toBe(false);
    expect(monday?.slots.map((slot) => slot.start_time)).toEqual([
      '06:00',
      '07:00',
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ]);

    expect(wednesday?.slots).toHaveLength(11);
    expect(saturday?.slots.map((slot) => slot.start_time)).toEqual([
      '07:00',
      '08:00',
      '09:00',
      '10:00',
    ]);
    expect(sunday?.is_closed).toBe(true);
    expect(sunday?.slots).toEqual([]);
  });

  it('validates schedule lines against default weekly slots', () => {
    expect(is_valid_recurring_weekly_slot(3, '18:00', 60)).toBe(true);
    expect(is_valid_recurring_weekly_slot(3, '13:00', 60)).toBe(false);
    expect(is_valid_recurring_weekly_slot(7, '09:00', 60)).toBe(false);
  });
});
