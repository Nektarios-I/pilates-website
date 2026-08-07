import { studio_date_key } from '@/lib/schedule/studio-hours';

import {
  generate_recurring_preview_occurrences,
  recurring_preview_end_date,
} from './recurring-preview';

export type SkippableScheduleLine = {
  day_of_week: number;
  start_time: string;
  first_occurrence_date: string;
};

export type ExistingSkip = {
  occurrence_date: string;
  start_time: string;
};

export type SkippableOccurrenceOption = {
  occurrence_date: string;
  start_time: string;
  day_of_week: number;
};

function normalize_time(value: string): string {
  return value.slice(0, 5);
}

/**
 * Occurrences that may be skipped/cancelled via either the old skip dropdown or the
 * three-month cancel modal: today..preview end, matching active lines, not already skipped.
 */
export function list_skippable_recurring_occurrences(options: {
  lines: readonly SkippableScheduleLine[];
  skips: readonly ExistingSkip[];
  studio_today?: string;
}): SkippableOccurrenceOption[] {
  const today = options.studio_today ?? studio_date_key();
  const skip_keys = new Set(
    options.skips.map((skip) => `${skip.occurrence_date}|${normalize_time(skip.start_time)}`),
  );
  const results: SkippableOccurrenceOption[] = [];

  for (const line of options.lines) {
    if (!line.first_occurrence_date) continue;
    const preview_end = recurring_preview_end_date(line.first_occurrence_date);
    const skipped_for_line = options.skips
      .filter((skip) => normalize_time(skip.start_time) === normalize_time(line.start_time))
      .map((skip) => skip.occurrence_date);

    const preview = generate_recurring_preview_occurrences({
      first_occurrence_date: line.first_occurrence_date,
      day_of_week: line.day_of_week,
      start_time: normalize_time(line.start_time),
      skipped_dates: skipped_for_line,
    });

    for (const occurrence of preview) {
      if (occurrence.occurrence_date < today) continue;
      if (occurrence.occurrence_date > preview_end) continue;
      const key = `${occurrence.occurrence_date}|${normalize_time(line.start_time)}`;
      if (skip_keys.has(key)) continue;
      if (occurrence.status === 'cancelled') continue;
      results.push({
        occurrence_date: occurrence.occurrence_date,
        start_time: normalize_time(line.start_time),
        day_of_week: line.day_of_week,
      });
    }
  }

  return results.sort((a, b) =>
    a.occurrence_date === b.occurrence_date
      ? a.start_time.localeCompare(b.start_time)
      : a.occurrence_date.localeCompare(b.occurrence_date),
  );
}

/** True when an occurrence lies in the shared three-month skip/cancel/materialize preview. */
export function is_within_recurring_preview_window(
  occurrence_date: string,
  first_occurrence_date: string,
  studio_today?: string,
): boolean {
  const today = studio_today ?? studio_date_key();
  if (occurrence_date < today) return false;
  if (occurrence_date < first_occurrence_date) return false;
  return occurrence_date <= recurring_preview_end_date(first_occurrence_date);
}
