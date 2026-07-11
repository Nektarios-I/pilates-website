import { ISO_WEEKDAY_OPTIONS } from '@/features/client-booking-manager/format';
import {
  add_days,
  generate_hourly_slots,
  get_default_weekly_ranges,
  parse_date_key,
} from '@/lib/schedule/studio-hours';

export type RecurringDaySlotOption = {
  start_time: string;
  end_time: string;
  label: string;
};

export type RecurringWeeklyDayOptions = {
  day_of_week: number;
  weekday_label: string;
  is_closed: boolean;
  slots: RecurringDaySlotOption[];
};

/** Fixed Monday reference for ISO weekday → calendar date mapping. */
const REFERENCE_MONDAY = parse_date_key('2024-01-01');

export function date_for_iso_weekday(iso_day_of_week: number): Date {
  return add_days(REFERENCE_MONDAY, iso_day_of_week - 1);
}

/** Hourly studio slots for each ISO weekday from default weekly hours (not a specific calendar week). */
export function build_recurring_weekly_slot_options(
  duration_minutes: number,
): RecurringWeeklyDayOptions[] {
  return ISO_WEEKDAY_OPTIONS.map(({ value, label }) => {
    const ranges = get_default_weekly_ranges(date_for_iso_weekday(value));
    const hourly = generate_hourly_slots(ranges, duration_minutes);

    return {
      day_of_week: value,
      weekday_label: label,
      is_closed: ranges.length === 0,
      slots: hourly.map((slot) => ({
        start_time: slot.start,
        end_time: slot.end,
        label: slot.label,
      })),
    };
  });
}

export function is_valid_recurring_weekly_slot(
  day_of_week: number,
  start_time: string,
  duration_minutes: number,
): boolean {
  const day = build_recurring_weekly_slot_options(duration_minutes).find(
    (entry) => entry.day_of_week === day_of_week,
  );

  if (!day || day.is_closed) return false;

  return day.slots.some((slot) => slot.start_time === start_time);
}
