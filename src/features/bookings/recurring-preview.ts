import { add_calendar_months } from '@/lib/schedule/calendar-months';
import { add_days, parse_date_key, to_date_key } from '@/lib/schedule/studio-hours';

import { iso_weekday_from_date_key } from './first-occurrence';

export type RecurringPreviewOccurrence = {
  occurrence_date: string;
  day_of_week: number;
  start_time: string;
  end_time?: string;
  session_title?: string;
  status?: 'planned' | 'booked' | 'waitlisted' | 'cancelled' | 'unavailable';
  booking_id?: string | null;
  selectable?: boolean;
};

export type RecurringPreviewMonthGroup = {
  month_key: string;
  month_label: string;
  occurrences: RecurringPreviewOccurrence[];
};

export function recurring_preview_end_date(first_occurrence_date: string): string {
  return add_calendar_months(first_occurrence_date, 3);
}

export function build_recurring_preview_range(first_occurrence_date: string): {
  start: string;
  end: string;
} {
  return {
    start: first_occurrence_date,
    end: recurring_preview_end_date(first_occurrence_date),
  };
}

/**
 * Weekly occurrences from first_occurrence through the inclusive three-calendar-month endpoint.
 * Pure / virtual — does not create bookings.
 */
export function generate_recurring_preview_occurrences(options: {
  first_occurrence_date: string;
  day_of_week: number;
  start_time: string;
  end_time?: string;
  session_title?: string;
  skipped_dates?: ReadonlySet<string> | readonly string[];
}): RecurringPreviewOccurrence[] {
  const { first_occurrence_date, day_of_week, start_time, end_time, session_title } = options;
  const end = recurring_preview_end_date(first_occurrence_date);

  if (iso_weekday_from_date_key(first_occurrence_date) !== day_of_week) {
    return [];
  }

  const skipped = new Set(
    Array.isArray(options.skipped_dates)
      ? options.skipped_dates
      : options.skipped_dates
        ? [...options.skipped_dates]
        : [],
  );

  const occurrences: RecurringPreviewOccurrence[] = [];
  let cursor = parse_date_key(first_occurrence_date);
  const end_date = parse_date_key(end);

  while (cursor <= end_date) {
    const occurrence_date = to_date_key(cursor);
    const is_skipped = skipped.has(occurrence_date);
    occurrences.push({
      occurrence_date,
      day_of_week,
      start_time,
      end_time,
      session_title,
      status: is_skipped ? 'cancelled' : 'planned',
      selectable: !is_skipped,
    });
    cursor = add_days(cursor, 7);
  }

  return occurrences;
}

export function group_recurring_preview_by_month(
  occurrences: RecurringPreviewOccurrence[],
  locale = 'en-GB',
): RecurringPreviewMonthGroup[] {
  const groups = new Map<string, RecurringPreviewMonthGroup>();

  for (const occurrence of occurrences) {
    const month_key = occurrence.occurrence_date.slice(0, 7);
    let group = groups.get(month_key);
    if (!group) {
      const [year, month] = month_key.split('-').map(Number);
      const label = new Date(year, month - 1, 1).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
      group = { month_key, month_label: label, occurrences: [] };
      groups.set(month_key, group);
    }
    group.occurrences.push(occurrence);
  }

  return [...groups.values()].sort((a, b) => a.month_key.localeCompare(b.month_key));
}

export function format_preview_range_label(start: string, end: string, locale = 'en-GB'): string {
  const format = (date_key: string) =>
    parse_date_key(date_key).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  return `${format(start)} – ${format(end)}`;
}

export function format_preview_occurrence_label(
  occurrence: RecurringPreviewOccurrence,
  locale = 'en-GB',
): string {
  const date_label = parse_date_key(occurrence.occurrence_date).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const time = occurrence.end_time
    ? `${occurrence.start_time.slice(0, 5)}–${occurrence.end_time.slice(0, 5)}`
    : occurrence.start_time.slice(0, 5);
  const title = occurrence.session_title ? ` · ${occurrence.session_title}` : '';
  return `${date_label} · ${time}${title}`;
}
