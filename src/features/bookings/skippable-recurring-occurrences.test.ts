import { describe, expect, it } from 'vitest';

import {
  is_within_recurring_preview_window,
  list_skippable_recurring_occurrences,
} from './skippable-recurring-occurrences';

describe('list_skippable_recurring_occurrences', () => {
  const line = {
    day_of_week: 1,
    start_time: '18:00:00',
    first_occurrence_date: '2026-08-24',
  };

  it('includes day+7 and day+45 within the three-month preview', () => {
    const rows = list_skippable_recurring_occurrences({
      lines: [line],
      skips: [],
      studio_today: '2026-08-06',
    });
    const dates = rows.map((row) => row.occurrence_date);
    expect(dates).toContain('2026-08-24');
    expect(dates).toContain('2026-08-31'); // +7 from first
    expect(dates).toContain('2026-10-05'); // well beyond 14 days from studio today
    expect(dates).not.toContain('2026-11-30'); // after preview end 2026-11-24
  });

  it('excludes already skipped occurrences so both UIs stay consistent', () => {
    const rows = list_skippable_recurring_occurrences({
      lines: [line],
      skips: [{ occurrence_date: '2026-09-07', start_time: '18:00' }],
      studio_today: '2026-08-06',
    });
    expect(rows.some((row) => row.occurrence_date === '2026-09-07')).toBe(false);
    expect(rows.some((row) => row.occurrence_date === '2026-09-14')).toBe(true);
  });

  it('excludes past dates even when they fall inside the preview range', () => {
    const rows = list_skippable_recurring_occurrences({
      lines: [
        {
          day_of_week: 1,
          start_time: '18:00',
          first_occurrence_date: '2026-08-03',
        },
      ],
      skips: [],
      studio_today: '2026-08-10',
    });
    expect(rows.every((row) => row.occurrence_date >= '2026-08-10')).toBe(true);
    expect(rows.some((row) => row.occurrence_date === '2026-08-03')).toBe(false);
  });
});

describe('is_within_recurring_preview_window', () => {
  it('matches the three-month inclusive preview used by cancel and materialize', () => {
    expect(is_within_recurring_preview_window('2026-08-24', '2026-08-24', '2026-08-06')).toBe(
      true,
    );
    expect(is_within_recurring_preview_window('2026-11-24', '2026-08-24', '2026-08-06')).toBe(
      true,
    );
    expect(is_within_recurring_preview_window('2026-11-25', '2026-08-24', '2026-08-06')).toBe(
      false,
    );
    expect(is_within_recurring_preview_window('2026-08-10', '2026-08-24', '2026-08-06')).toBe(
      false,
    );
  });
});
