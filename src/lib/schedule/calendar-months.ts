import { to_date_key } from '@/lib/schedule/studio-hours';

/**
 * Add whole calendar months to a YYYY-MM-DD date key.
 * Clamps the day when the target month is shorter (e.g. 31 Jan + 1 month → 28/29 Feb).
 */
export function add_calendar_months(date_key: string, months: number): string {
  const [year, month, day] = date_key.split('-').map(Number);
  const target_month_start = new Date(year, month - 1 + months, 1);
  const last_day = new Date(
    target_month_start.getFullYear(),
    target_month_start.getMonth() + 1,
    0,
  ).getDate();
  const clamped_day = Math.min(day, last_day);
  return to_date_key(
    new Date(target_month_start.getFullYear(), target_month_start.getMonth(), clamped_day),
  );
}
