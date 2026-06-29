export type TimeRange = {
  start: string;
  end: string;
};

export type DaySchedule = {
  date: string;
  is_closed: boolean;
  time_ranges: TimeRange[];
  is_override: boolean;
};

export type HourlySlot = {
  start: string;
  end: string;
  label: string;
};

const STUDIO_TIMEZONE = 'Europe/Nicosia';

function parse_minutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function format_minutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function generate_hourly_slots(ranges: TimeRange[], duration_minutes = 60): HourlySlot[] {
  const slots: HourlySlot[] = [];
  const duration = Math.max(15, duration_minutes);

  for (const range of ranges) {
    let cursor = parse_minutes(range.start);
    const end = parse_minutes(range.end);

    while (cursor + duration <= end) {
      const start = format_minutes(cursor);
      const slot_end = format_minutes(cursor + duration);
      slots.push({
        start,
        end: slot_end,
        label: `${start} – ${slot_end}`,
      });
      cursor += duration;
    }
  }

  return slots;
}

export function get_default_weekly_ranges(date: Date): TimeRange[] {
  const day = date.getDay();

  if (day >= 1 && day <= 5) {
    return [
      { start: '06:00', end: '12:00' },
      { start: '15:00', end: '20:00' },
    ];
  }

  if (day === 6) {
    return [{ start: '07:00', end: '11:00' }];
  }

  return [];
}

export function to_date_key(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Calendar date for the studio timezone (YYYY-MM-DD). */
export function studio_date_key(now = new Date(), time_zone = STUDIO_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: time_zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function parse_date_key(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function start_of_week_monday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function add_days(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function is_same_day(a: Date, b: Date): boolean {
  return to_date_key(a) === to_date_key(b);
}

export function is_past_day(date: Date, now = new Date()): boolean {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

export function get_month_grid(anchor: Date): Date[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const start = start_of_week_monday(first);
  const days: Date[] = [];

  for (let i = 0; i < 42; i += 1) {
    days.push(add_days(start, i));
  }

  return days;
}

export function format_day_number(date: Date): string {
  return String(date.getDate());
}

export function format_weekday_short(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

export function format_month_year(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export { STUDIO_TIMEZONE };
