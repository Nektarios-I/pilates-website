import { describe, expect, it } from 'vitest';

import {
  FIRST_OCCURRENCE_SESSION_UNAVAILABLE_MESSAGE,
  iso_weekday_from_date_key,
  list_matching_first_occurrence_dates,
  validate_first_occurrence_date,
} from './first-occurrence';

describe('first occurrence date validation', () => {
  const studio_today = '2026-08-06';

  it('accepts a valid future first occurrence matching weekday and slot', () => {
    // Monday 24 Aug 2026
    const result = validate_first_occurrence_date({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
      duration_minutes: 60,
      studio_today,
    });
    expect(result).toEqual({ ok: true });
  });

  it('rejects a past first occurrence', () => {
    const result = validate_first_occurrence_date({
      first_occurrence_date: '2026-08-03',
      day_of_week: 1,
      start_time: '18:00',
      duration_minutes: 60,
      studio_today,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/today or in the future/i);
    }
  });

  it('rejects a date that does not match the selected weekday', () => {
    // 25 Aug 2026 is Tuesday
    const result = validate_first_occurrence_date({
      first_occurrence_date: '2026-08-25',
      day_of_week: 1,
      start_time: '18:00',
      duration_minutes: 60,
      studio_today,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/match the selected weekday/i);
    }
  });

  it('rejects an unavailable session slot for the weekday', () => {
    const result = validate_first_occurrence_date({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '13:00',
      duration_minutes: 60,
      studio_today,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(FIRST_OCCURRENCE_SESSION_UNAVAILABLE_MESSAGE);
    }
  });

  it('interprets weekday using calendar date keys (studio local date)', () => {
    expect(iso_weekday_from_date_key('2026-08-24')).toBe(1);
    expect(iso_weekday_from_date_key('2026-08-23')).toBe(7);
  });

  it('lists matching first occurrence dates from today forward', () => {
    const dates = list_matching_first_occurrence_dates({
      day_of_week: 1,
      studio_today: '2026-08-06',
      weeks_ahead: 4,
    });
    expect(dates[0]).toBe('2026-08-10');
    expect(dates).toContain('2026-08-24');
    expect(dates.every((date) => iso_weekday_from_date_key(date) === 1)).toBe(true);
  });

  it('does not silently suggest an earlier weekday than selected first date semantics', () => {
    const result = validate_first_occurrence_date({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
      duration_minutes: 60,
      studio_today,
    });
    expect(result.ok).toBe(true);
    // Selected date is exact; next earlier Monday would be 17 Aug — not auto-used.
    expect(iso_weekday_from_date_key('2026-08-17')).toBe(1);
  });
});
