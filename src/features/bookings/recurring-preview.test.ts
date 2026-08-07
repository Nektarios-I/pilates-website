import { describe, expect, it } from 'vitest';

import {
  build_recurring_preview_range,
  format_preview_range_label,
  generate_recurring_preview_occurrences,
  group_recurring_preview_by_month,
  recurring_preview_end_date,
} from './recurring-preview';

describe('three-calendar-month recurring preview', () => {
  it('begins on the exact selected first occurrence', () => {
    const rows = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
      end_time: '19:00',
      session_title: 'Reformer',
    });
    expect(rows[0]?.occurrence_date).toBe('2026-08-24');
  });

  it('ends on the inclusive three-calendar-month endpoint, not 90 days', () => {
    expect(recurring_preview_end_date('2026-08-24')).toBe('2026-11-24');
    // 90 days from 24 Aug is 22 Nov. Calendar endpoint is 24 Nov (inclusive).
    // Weekly Mondays include 23 Nov (≤ 24 Nov) and exclude 30 Nov.
    const rows = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
    });
    expect(rows.some((row) => row.occurrence_date === '2026-11-23')).toBe(true);
    expect(rows.some((row) => row.occurrence_date === '2026-11-30')).toBe(false);
    expect(rows.every((row) => row.occurrence_date <= '2026-11-24')).toBe(true);
  });

  it('includes all weekly occurrences in the inclusive range', () => {
    const rows = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
    });
    expect(rows.map((row) => row.occurrence_date)).toEqual([
      '2026-08-24',
      '2026-08-31',
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
    ]);
    // 24 Nov is a Tuesday; last Monday in range is 23 Nov.
    expect(build_recurring_preview_range('2026-08-24')).toEqual({
      start: '2026-08-24',
      end: '2026-11-24',
    });
  });

  it('crosses month and year boundaries correctly', () => {
    const rows = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-11-30',
      day_of_week: 1,
      start_time: '09:00',
    });
    // 30 Nov 2026 is Monday
    expect(rows[0]?.occurrence_date).toBe('2026-11-30');
    expect(recurring_preview_end_date('2026-11-30')).toBe('2027-02-28');
    expect(rows.some((row) => row.occurrence_date.startsWith('2027-'))).toBe(true);
  });

  it('is chronologically sorted and groups by month', () => {
    const rows = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
    });
    const dates = rows.map((row) => row.occurrence_date);
    expect([...dates].sort()).toEqual(dates);

    const groups = group_recurring_preview_by_month(rows);
    expect(groups.map((group) => group.month_key)).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
  });

  it('updates when weekday, slot, or first date changes (no duplicates)', () => {
    const monday = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
    });
    const tuesday = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-25',
      day_of_week: 2,
      start_time: '09:00',
    });
    expect(monday[0]?.occurrence_date).not.toBe(tuesday[0]?.occurrence_date);
    expect(new Set(monday.map((row) => row.occurrence_date)).size).toBe(monday.length);
  });

  it('marks skipped dates as cancelled and not selectable', () => {
    const rows = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-24',
      day_of_week: 1,
      start_time: '18:00',
      skipped_dates: ['2026-09-07', '2026-09-21'],
    });
    const skipped = rows.find((row) => row.occurrence_date === '2026-09-07');
    expect(skipped?.status).toBe('cancelled');
    expect(skipped?.selectable).toBe(false);
  });

  it('does not invent occurrences when weekday mismatches first date', () => {
    const rows = generate_recurring_preview_occurrences({
      first_occurrence_date: '2026-08-25',
      day_of_week: 1,
      start_time: '18:00',
    });
    expect(rows).toEqual([]);
  });

  it('formats the planned sessions range label', () => {
    expect(format_preview_range_label('2026-08-24', '2026-11-24')).toMatch(/24/);
  });
});
