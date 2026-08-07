import { is_valid_recurring_weekly_slot } from '@/features/bookings/recurring-weekly-slot-options';
import { parse_date_key, studio_date_key } from '@/lib/schedule/studio-hours';

export const FIRST_OCCURRENCE_SESSION_UNAVAILABLE_MESSAGE =
  'This session is not available on the selected date. Choose another first occurrence date or session slot.';

export type FirstOccurrenceValidationInput = {
  first_occurrence_date: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  studio_today?: string;
};

export type FirstOccurrenceValidationResult =
  | { ok: true }
  | { ok: false; error: string };

/** ISO weekday 1=Mon … 7=Sun for a YYYY-MM-DD calendar date. */
export function iso_weekday_from_date_key(date_key: string): number {
  const js_day = parse_date_key(date_key).getDay();
  return js_day === 0 ? 7 : js_day;
}

export function validate_first_occurrence_date(
  input: FirstOccurrenceValidationInput,
): FirstOccurrenceValidationResult {
  const today = input.studio_today ?? studio_date_key();
  const { first_occurrence_date, day_of_week, start_time, duration_minutes } = input;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(first_occurrence_date)) {
    return { ok: false, error: 'Choose a valid first session date.' };
  }

  if (first_occurrence_date < today) {
    return { ok: false, error: 'The first session date must be today or in the future.' };
  }

  if (iso_weekday_from_date_key(first_occurrence_date) !== day_of_week) {
    return {
      ok: false,
      error: 'The first session date must match the selected weekday.',
    };
  }

  if (!is_valid_recurring_weekly_slot(day_of_week, start_time, duration_minutes)) {
    return { ok: false, error: FIRST_OCCURRENCE_SESSION_UNAVAILABLE_MESSAGE };
  }

  return { ok: true };
}

/** Candidate first-occurrence dates matching a weekday from studio today forward. */
export function list_matching_first_occurrence_dates(options: {
  day_of_week: number;
  studio_today?: string;
  weeks_ahead?: number;
}): string[] {
  const today = options.studio_today ?? studio_date_key();
  const weeks = options.weeks_ahead ?? 52;
  const start = parse_date_key(today);
  const results: string[] = [];

  for (let offset = 0; offset < weeks * 7; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    const year = candidate.getFullYear();
    const month = String(candidate.getMonth() + 1).padStart(2, '0');
    const day = String(candidate.getDate()).padStart(2, '0');
    const date_key = `${year}-${month}-${day}`;
    if (iso_weekday_from_date_key(date_key) === options.day_of_week) {
      results.push(date_key);
    }
  }

  return results;
}
