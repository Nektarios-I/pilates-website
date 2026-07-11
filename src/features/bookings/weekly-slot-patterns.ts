import { ISO_WEEKDAY_OPTIONS } from '@/features/client-booking-manager/format';
import { parse_date_key } from '@/lib/schedule/studio-hours';

export type WeeklySlotPattern = {
  day_of_week: number;
  weekday_label: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  pattern_key: string;
  label: string;
};

export type WeeklySlotDayInput = {
  date_key: string;
  slots: Array<{ slot_start: string; slot_end: string }>;
  duration_minutes: number;
};

/** ISO weekday 1=Mon … 7=Sun for a studio calendar date key. */
export function iso_day_of_week_from_date_key(date_key: string): number {
  const js_day = parse_date_key(date_key).getDay();
  return js_day === 0 ? 7 : js_day;
}

export function build_weekly_slot_patterns(entries: WeeklySlotDayInput[]): WeeklySlotPattern[] {
  const map = new Map<string, WeeklySlotPattern>();

  for (const entry of entries) {
    const day_of_week = iso_day_of_week_from_date_key(entry.date_key);
    const weekday_label =
      ISO_WEEKDAY_OPTIONS.find((day) => day.value === day_of_week)?.label ?? 'Day';

    for (const slot of entry.slots) {
      const pattern_key = `${day_of_week}-${slot.slot_start}`;
      if (map.has(pattern_key)) continue;

      map.set(pattern_key, {
        day_of_week,
        weekday_label,
        start_time: slot.slot_start,
        end_time: slot.slot_end,
        duration_minutes: entry.duration_minutes,
        pattern_key,
        label: `${weekday_label}s at ${slot.slot_start}`,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time),
  );
}

export function pattern_matches_line(
  pattern: WeeklySlotPattern,
  day_of_week: number,
  start_time: string,
): boolean {
  return pattern.day_of_week === day_of_week && pattern.start_time === start_time;
}
