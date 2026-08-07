import { describe, expect, it } from 'vitest';

import {
  cancel_confirmation_copy,
  cancel_selected_sessions_enabled,
  default_cancel_selection_keys,
  filter_cancellable_modal_occurrences,
  is_occurrence_cancellable,
  occurrence_selection_key,
  summarize_cancel_batch,
  type CancelRecurringOccurrenceItem,
} from './recurring-occurrence-cancellation';

describe('selected recurring occurrence cancellation helpers', () => {
  const items: CancelRecurringOccurrenceItem[] = [
    {
      occurrence_date: '2026-08-24',
      start_time: '18:00',
      state: 'planned',
    },
    {
      occurrence_date: '2026-08-31',
      start_time: '18:00',
      state: 'booked',
      booking_id: 'booking-1',
    },
    {
      occurrence_date: '2026-09-07',
      start_time: '18:00',
      state: 'cancelled',
    },
    {
      occurrence_date: '2026-08-01',
      start_time: '18:00',
      state: 'past',
    },
    {
      occurrence_date: '2026-09-14',
      start_time: '18:00',
      state: 'unavailable',
    },
  ];

  it('defaults checkboxes to unselected', () => {
    expect(default_cancel_selection_keys().size).toBe(0);
  });

  it('disables cancel action until at least one occurrence is selected', () => {
    expect(cancel_selected_sessions_enabled(0)).toBe(false);
    expect(cancel_selected_sessions_enabled(1)).toBe(true);
  });

  it('allows planned, booked, and waitlisted; blocks cancelled, past, unavailable', () => {
    expect(is_occurrence_cancellable(items[0]!)).toBe(true);
    expect(is_occurrence_cancellable(items[1]!)).toBe(true);
    expect(is_occurrence_cancellable({ ...items[0]!, state: 'waitlisted' })).toBe(true);
    expect(is_occurrence_cancellable(items[2]!)).toBe(false);
    expect(is_occurrence_cancellable(items[3]!)).toBe(false);
    expect(is_occurrence_cancellable(items[4]!)).toBe(false);
  });

  it('excludes past dates from the modal list when filtering by studio today', () => {
    const visible = filter_cancellable_modal_occurrences(items, '2026-08-06');
    expect(visible.every((row) => row.occurrence_date >= '2026-08-06')).toBe(true);
    expect(visible.some((row) => row.state === 'past')).toBe(false);
  });

  it('builds confirmation copy that preserves the recurring rule', () => {
    const copy = cancel_confirmation_copy(3);
    expect(copy.title).toMatch(/Cancel 3 selected/);
    expect(copy.body).toMatch(/will not end the recurring rule/i);
    expect(copy.confirm_label).toBe('Cancel selected sessions');
  });

  it('summarizes partial and full batch results', () => {
    const full = summarize_cancel_batch([
      { occurrence_date: '2026-09-07', start_time: '18:00', success: true, mode: 'skip' },
      { occurrence_date: '2026-09-21', start_time: '18:00', success: true, mode: 'cancel_booking' },
    ]);
    expect(full.all_succeeded).toBe(true);
    expect(full.message).toMatch(/remains active/i);

    const partial = summarize_cancel_batch([
      { occurrence_date: '2026-09-07', start_time: '18:00', success: true },
      { occurrence_date: '2026-09-21', start_time: '18:00', success: false, error: 'cutoff' },
    ]);
    expect(partial.all_succeeded).toBe(false);
    expect(partial.failed).toBe(1);
  });

  it('builds stable selection keys', () => {
    expect(occurrence_selection_key('2026-09-07', '18:00:00')).toBe('2026-09-07|18:00');
  });
});
