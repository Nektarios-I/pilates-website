import { describe, expect, it } from 'vitest';

import {
  build_weekly_slot_patterns,
  iso_day_of_week_from_date_key,
  pattern_matches_line,
} from '@/features/bookings/weekly-slot-patterns';

describe('weekly-slot-patterns', () => {
  it('maps calendar dates to ISO weekdays', () => {
    expect(iso_day_of_week_from_date_key('2026-07-06')).toBe(1);
    expect(iso_day_of_week_from_date_key('2026-07-08')).toBe(3);
  });

  it('deduplicates weekly slot patterns across reference days', () => {
    const patterns = build_weekly_slot_patterns([
      {
        date_key: '2026-07-08',
        duration_minutes: 60,
        slots: [{ slot_start: '09:00', slot_end: '10:00' }],
      },
      {
        date_key: '2026-07-15',
        duration_minutes: 60,
        slots: [{ slot_start: '09:00', slot_end: '10:00' }],
      },
    ]);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({
      day_of_week: 3,
      start_time: '09:00',
      label: 'Wednesdays at 09:00',
    });
  });

  it('matches schedule lines to patterns', () => {
    const pattern = build_weekly_slot_patterns([
      {
        date_key: '2026-07-08',
        duration_minutes: 60,
        slots: [{ slot_start: '18:00', slot_end: '19:00' }],
      },
    ])[0];

    expect(pattern_matches_line(pattern, 3, '18:00')).toBe(true);
    expect(pattern_matches_line(pattern, 4, '18:00')).toBe(false);
  });
});
