'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  list_matching_first_occurrence_dates,
  validate_first_occurrence_date,
} from '@/features/bookings/first-occurrence';
import { build_recurring_weekly_slot_options } from '@/features/bookings/recurring-weekly-slot-options';
import { RecurringPlannedSessionsPreview } from '@/features/client-booking-manager/components/recurring-planned-sessions-preview';
import type { RecurringScheduleLine } from '@/features/client-booking-manager/types';
import { parse_date_key } from '@/lib/schedule/studio-hours';

type RecurringWeeklySlotPickerProps = {
  duration_minutes: number;
  active_lines: RecurringScheduleLine[];
  session_title?: string;
  disabled?: boolean;
  on_add: (day_of_week: number, start_time: string, first_occurrence_date: string) => void;
};

export function RecurringWeeklySlotPicker({
  duration_minutes,
  active_lines,
  session_title,
  disabled = false,
  on_add,
}: RecurringWeeklySlotPickerProps) {
  const day_options = useMemo(
    () => build_recurring_weekly_slot_options(duration_minutes),
    [duration_minutes],
  );
  const [selected_by_day, set_selected_by_day] = useState<
    Record<number, { start_time: string; first_occurrence_date: string }>
  >({});

  return (
    <div className="mt-4 space-y-3">
      {day_options.map((day) => {
        const added_times = new Set(
          active_lines
            .filter((line) => line.day_of_week === day.day_of_week)
            .map((line) => line.start_time),
        );
        const available_slots = day.slots.filter((slot) => !added_times.has(slot.start_time));
        const selected = selected_by_day[day.day_of_week] ?? {
          start_time: '',
          first_occurrence_date: '',
        };
        const first_date_options = list_matching_first_occurrence_dates({
          day_of_week: day.day_of_week,
          weeks_ahead: 52,
        });
        const validation =
          selected.start_time && selected.first_occurrence_date
            ? validate_first_occurrence_date({
                first_occurrence_date: selected.first_occurrence_date,
                day_of_week: day.day_of_week,
                start_time: selected.start_time,
                duration_minutes,
              })
            : null;
        const can_add =
          Boolean(selected.start_time) &&
          Boolean(selected.first_occurrence_date) &&
          validation?.ok === true;
        const selected_slot = available_slots.find((slot) => slot.start_time === selected.start_time);

        return (
          <div key={day.day_of_week} className="space-y-3 rounded-md border border-border/60 px-3 py-3">
            <p className="text-sm font-medium text-foreground">{day.weekday_label}</p>

            {day.is_closed ? (
              <p className="text-sm text-foreground/60">Studio closed</p>
            ) : available_slots.length === 0 ? (
              <p className="text-sm text-foreground/60">
                All default slots for this day are already on the rule.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-sm font-medium text-foreground"
                      htmlFor={`recurring-slot-${day.day_of_week}`}
                    >
                      Session slot
                    </label>
                    <select
                      className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      id={`recurring-slot-${day.day_of_week}`}
                      onChange={(event) =>
                        set_selected_by_day((current) => ({
                          ...current,
                          [day.day_of_week]: {
                            start_time: event.target.value,
                            first_occurrence_date:
                              current[day.day_of_week]?.first_occurrence_date ?? '',
                          },
                        }))
                      }
                      value={selected.start_time}
                    >
                      <option value="">Select time</option>
                      {available_slots.map((slot) => (
                        <option key={slot.start_time} value={slot.start_time}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-foreground"
                      htmlFor={`recurring-first-${day.day_of_week}`}
                    >
                      First session date
                    </label>
                    <select
                      className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      disabled={!selected.start_time}
                      id={`recurring-first-${day.day_of_week}`}
                      onChange={(event) =>
                        set_selected_by_day((current) => ({
                          ...current,
                          [day.day_of_week]: {
                            start_time: current[day.day_of_week]?.start_time ?? '',
                            first_occurrence_date: event.target.value,
                          },
                        }))
                      }
                      value={selected.first_occurrence_date}
                    >
                      <option value="">Select first date</option>
                      {first_date_options.map((date_key) => (
                        <option key={date_key} value={date_key}>
                          {parse_date_key(date_key).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-foreground/60">
                      Choose the first session this recurring booking should apply to.
                    </p>
                  </div>
                </div>

                {validation && !validation.ok ? (
                  <p className="text-sm text-danger-foreground">{validation.error}</p>
                ) : null}

                <RecurringPlannedSessionsPreview
                  day_of_week={selected.start_time ? day.day_of_week : null}
                  end_time={selected_slot?.end_time}
                  first_occurrence_date={selected.first_occurrence_date}
                  session_title={session_title}
                  start_time={selected.start_time}
                />

                <Button
                  disabled={disabled || !can_add}
                  onClick={() => {
                    if (!can_add) return;
                    on_add(day.day_of_week, selected.start_time, selected.first_occurrence_date);
                    set_selected_by_day((current) => ({
                      ...current,
                      [day.day_of_week]: { start_time: '', first_occurrence_date: '' },
                    }));
                  }}
                  size="sm"
                >
                  Add slot
                </Button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
