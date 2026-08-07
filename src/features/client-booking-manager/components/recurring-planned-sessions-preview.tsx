'use client';

import { useMemo } from 'react';

import {
  build_recurring_preview_range,
  format_preview_occurrence_label,
  format_preview_range_label,
  generate_recurring_preview_occurrences,
  group_recurring_preview_by_month,
} from '@/features/bookings/recurring-preview';

type RecurringPlannedSessionsPreviewProps = {
  day_of_week: number | null;
  first_occurrence_date: string;
  start_time: string;
  end_time?: string;
  session_title?: string;
  skipped_dates?: readonly string[];
};

export function RecurringPlannedSessionsPreview({
  day_of_week,
  first_occurrence_date,
  start_time,
  end_time,
  session_title,
  skipped_dates = [],
}: RecurringPlannedSessionsPreviewProps) {
  const ready =
    Boolean(day_of_week) &&
    Boolean(first_occurrence_date) &&
    Boolean(start_time) &&
    /^\d{4}-\d{2}-\d{2}$/.test(first_occurrence_date);

  const occurrences = useMemo(() => {
    if (!ready || !day_of_week) return [];
    return generate_recurring_preview_occurrences({
      first_occurrence_date,
      day_of_week,
      start_time,
      end_time,
      session_title,
      skipped_dates,
    });
  }, [ready, day_of_week, first_occurrence_date, start_time, end_time, session_title, skipped_dates]);

  const groups = useMemo(() => group_recurring_preview_by_month(occurrences), [occurrences]);
  const range = ready ? build_recurring_preview_range(first_occurrence_date) : null;

  if (!ready) {
    return (
      <section className="mt-4 rounded-md border border-border/70 px-3 py-3">
        <h3 className="text-sm font-semibold text-foreground">Planned sessions</h3>
        <p className="mt-1 text-sm text-foreground/60">
          Choose weekday, session slot, and first session date to preview the next three calendar
          months.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-md border border-border/70 px-3 py-3">
      <h3 className="text-sm font-semibold text-foreground">Planned sessions</h3>
      {range ? (
        <p className="mt-1 text-xs text-foreground/60">
          {format_preview_range_label(range.start, range.end)}
        </p>
      ) : null}

      {occurrences.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/60">
          No valid planned sessions for this selection.
        </p>
      ) : (
        <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group.month_key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                {group.month_label}
              </p>
              <ul className="mt-2 space-y-1.5">
                {group.occurrences.map((occurrence) => (
                  <li
                    key={`${occurrence.occurrence_date}-${occurrence.start_time}`}
                    className={[
                      'text-sm text-foreground',
                      occurrence.status === 'cancelled' ? 'text-foreground/45 line-through' : '',
                    ].join(' ')}
                  >
                    {format_preview_occurrence_label(occurrence)}
                    {occurrence.status === 'cancelled' ? ' · Cancelled' : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
