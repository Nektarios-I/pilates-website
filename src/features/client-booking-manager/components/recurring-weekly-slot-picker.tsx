'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { build_recurring_weekly_slot_options } from '@/features/bookings/recurring-weekly-slot-options';
import type { RecurringScheduleLine } from '@/features/client-booking-manager/types';

type RecurringWeeklySlotPickerProps = {
  duration_minutes: number;
  active_lines: RecurringScheduleLine[];
  disabled?: boolean;
  on_add: (day_of_week: number, start_time: string) => void;
};

export function RecurringWeeklySlotPicker({
  duration_minutes,
  active_lines,
  disabled = false,
  on_add,
}: RecurringWeeklySlotPickerProps) {
  const day_options = useMemo(
    () => build_recurring_weekly_slot_options(duration_minutes),
    [duration_minutes],
  );
  const [selected_by_day, set_selected_by_day] = useState<Record<number, string>>({});

  return (
    <div className="mt-4 space-y-3">
      {day_options.map((day) => {
        const added_times = new Set(
          active_lines
            .filter((line) => line.day_of_week === day.day_of_week)
            .map((line) => line.start_time),
        );
        const available_slots = day.slots.filter((slot) => !added_times.has(slot.start_time));
        const selected_start = selected_by_day[day.day_of_week] ?? '';

        return (
          <div
            key={day.day_of_week}
            className="grid gap-2 rounded-md border border-border/60 px-3 py-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-end"
          >
            <p className="text-sm font-medium text-foreground">{day.weekday_label}</p>

            {day.is_closed ? (
              <p className="text-sm text-foreground/60 sm:col-span-2">Studio closed</p>
            ) : available_slots.length === 0 ? (
              <p className="text-sm text-foreground/60 sm:col-span-2">
                All default slots for this day are already on the rule.
              </p>
            ) : (
              <>
                <div>
                  <label
                    className="sr-only"
                    htmlFor={`recurring-slot-${day.day_of_week}`}
                  >
                    {day.weekday_label} time slot
                  </label>
                  <select
                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    id={`recurring-slot-${day.day_of_week}`}
                    onChange={(event) =>
                      set_selected_by_day((current) => ({
                        ...current,
                        [day.day_of_week]: event.target.value,
                      }))
                    }
                    value={selected_start}
                  >
                    <option value="">Select time</option>
                    {available_slots.map((slot) => (
                      <option key={slot.start_time} value={slot.start_time}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  disabled={disabled || !selected_start}
                  onClick={() => {
                    if (!selected_start) return;
                    on_add(day.day_of_week, selected_start);
                    set_selected_by_day((current) => ({
                      ...current,
                      [day.day_of_week]: '',
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
