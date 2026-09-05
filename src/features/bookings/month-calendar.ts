import {
  get_month_grid,
  parse_date_key,
  studio_date_key,
  to_date_key,
} from '@/lib/schedule/studio-hours';

import { is_active_booking_status, studio_time_from_iso } from './day-bookings';
import { format_session_type } from './staff-bookings';

export type MonthCalendarKind = 'reformer' | 'mat' | 'private' | 'intro' | 'other';

export type TypeCounts = {
  reformer: number;
  mat: number;
  private: number;
  intro: number;
  other: number;
};

export type MonthCalendarBooking = {
  id: string;
  user_id: string;
  client_name: string;
  session_type: string;
  kind: MonthCalendarKind;
  starts_at: string;
  date_key: string;
  hour: number;
};

export type MonthCalendarSlotBooking = {
  id: string;
  user_id: string;
  compact_name: string;
  session_type_label: string;
  kind: MonthCalendarKind;
};

export type MonthCalendarHourSlot = {
  hour: number;
  time_label: string;
  counts: TypeCounts;
  reformer: MonthCalendarSlotBooking[];
  mat: MonthCalendarSlotBooking[];
  other: MonthCalendarSlotBooking[];
};

export type MonthCalendarDay = {
  date_key: string;
  day_number: number;
  weekday_short: string;
  is_today: boolean;
  is_current_month: boolean;
  counts: TypeCounts;
  total_active: number;
  grade: 0 | 1 | 2 | 3 | 4;
};

export type MonthCalendarOverview = {
  year: number;
  month: number;
  month_label: string;
  days: MonthCalendarDay[];
  bookings: MonthCalendarBooking[];
};

type RawMonthCalendarRow = {
  id: string;
  user_id: string | null;
  status: string;
  profiles:
    | { full_name: string | null; email: string | null; phone: string | null }
    | { full_name: string | null; email: string | null; phone: string | null }[];
  sessions:
    | { starts_at: string; session_type: string }
    | { starts_at: string; session_type: string }[]
    | null;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function related_row<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function empty_type_counts(): TypeCounts {
  return { reformer: 0, mat: 0, private: 0, intro: 0, other: 0 };
}

export function classify_session_type(session_type: string): MonthCalendarKind {
  if (session_type === 'reformer') return 'reformer';
  if (session_type === 'mat') return 'mat';
  if (session_type === 'private') return 'private';
  if (session_type === 'intro') return 'intro';
  return 'other';
}

export function format_compact_client_name(full_name: string | null | undefined): string {
  const trimmed = full_name?.trim() ?? '';
  if (!trimmed) return 'Unnamed client';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!;

  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  return `${first} ${last.slice(0, 3)}`;
}

export function format_type_counts_label(counts: TypeCounts): string {
  const total = counts.reformer + counts.mat + counts.private + counts.intro + counts.other;
  if (total === 0) return 'No sessions';

  return format_slot_counts_label(counts);
}

/** Compact counts for narrow month cells. Screen-reader labels stay verbose. */
export function format_compact_type_counts_label(counts: TypeCounts): string {
  const total = counts.reformer + counts.mat + counts.private + counts.intro + counts.other;
  if (total === 0) return 'No sessions';

  const parts = [`${counts.reformer}R`, `${counts.mat}M`];
  if (counts.private > 0) parts.push(`${counts.private}P`);
  if (counts.intro > 0) parts.push(`${counts.intro}I`);
  if (counts.other > 0) parts.push(`${counts.other}O`);
  return parts.join(' ');
}

export function format_slot_counts_label(counts: TypeCounts): string {
  const parts = [`${counts.reformer} Reformer`, `${counts.mat} Mat`];
  if (counts.private > 0) parts.push(`${counts.private} Private`);
  if (counts.intro > 0) parts.push(`${counts.intro} Intro`);
  if (counts.other > 0) parts.push(`${counts.other} Other`);
  return parts.join(', ');
}

export function grade_session_density(total: number): 0 | 1 | 2 | 3 | 4 {
  if (total <= 0) return 0;
  if (total <= 2) return 1;
  if (total <= 5) return 2;
  if (total <= 9) return 3;
  return 4;
}

export function shift_year_month(
  year: number,
  month: number,
  delta_months: number,
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta_months, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function studio_month_grid_window_bounds(
  year: number,
  month: number,
): { range_start: string; range_end: string } {
  const grid = get_month_grid(new Date(year, month - 1, 1));
  const start = to_date_key(grid[0]!);
  const end = to_date_key(grid[grid.length - 1]!);
  return {
    range_start: `${start}T00:00:00`,
    range_end: `${end}T23:59:59`,
  };
}

export function year_dropdown_options(selected_year: number, now_year: number): number[] {
  const start = Math.min(selected_year, now_year - 20);
  const end = Math.max(selected_year, now_year + 20);
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
}

export function format_month_calendar_label(year: number, month: number): string {
  const month_name = MONTH_NAMES[month - 1] ?? '';
  return `${month_name} ${year}`;
}

function increment_count(counts: TypeCounts, kind: MonthCalendarKind): void {
  counts[kind] += 1;
}

export function map_month_calendar_booking(row: RawMonthCalendarRow): MonthCalendarBooking | null {
  if (!row.user_id) return null;
  if (!is_active_booking_status(row.status)) return null;

  const session = related_row(row.sessions);
  if (!session) return null;

  const profile = related_row(row.profiles);
  const time = studio_time_from_iso(session.starts_at);
  const [hour_text] = time.split(':');
  const hour = Number(hour_text);

  return {
    id: row.id,
    user_id: row.user_id,
    client_name: profile?.full_name?.trim() || 'Unnamed client',
    session_type: session.session_type,
    kind: classify_session_type(session.session_type),
    starts_at: session.starts_at,
    date_key: studio_date_key(new Date(session.starts_at)),
    hour: Number.isFinite(hour) ? hour : 0,
  };
}

export function build_month_calendar_days(options: {
  year: number;
  month: number;
  bookings: MonthCalendarBooking[];
  today_key?: string;
}): MonthCalendarDay[] {
  const today_key = options.today_key ?? studio_date_key();
  const grid = get_month_grid(new Date(options.year, options.month - 1, 1));
  const by_day = new Map<string, TypeCounts>();

  for (const item of options.bookings) {
    const current = by_day.get(item.date_key) ?? empty_type_counts();
    increment_count(current, item.kind);
    by_day.set(item.date_key, current);
  }

  return grid.map((date) => {
    const date_key = to_date_key(date);
    const counts = by_day.get(date_key) ?? empty_type_counts();
    const total_active =
      counts.reformer + counts.mat + counts.private + counts.intro + counts.other;

    return {
      date_key,
      day_number: date.getDate(),
      weekday_short: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      is_today: date_key === today_key,
      is_current_month: date.getMonth() === options.month - 1,
      counts,
      total_active,
      grade: grade_session_density(total_active),
    };
  });
}

export function build_month_calendar_overview(options: {
  year: number;
  month: number;
  bookings: MonthCalendarBooking[];
  today_key?: string;
}): MonthCalendarOverview {
  return {
    year: options.year,
    month: options.month,
    month_label: format_month_calendar_label(options.year, options.month),
    days: build_month_calendar_days(options),
    bookings: options.bookings,
  };
}

function to_slot_booking(item: MonthCalendarBooking): MonthCalendarSlotBooking {
  return {
    id: item.id,
    user_id: item.user_id,
    compact_name: format_compact_client_name(item.client_name),
    session_type_label: format_session_type(item.session_type),
    kind: item.kind,
  };
}

export function build_day_hour_slots(options: {
  date_key: string;
  bookings: MonthCalendarBooking[];
}): MonthCalendarHourSlot[] {
  const day_bookings = options.bookings.filter((item) => item.date_key === options.date_key);

  return Array.from({ length: 24 }, (_, hour) => {
    const hour_bookings = day_bookings.filter((item) => item.hour === hour);
    const counts = empty_type_counts();
    const reformer: MonthCalendarSlotBooking[] = [];
    const mat: MonthCalendarSlotBooking[] = [];
    const private_bookings: MonthCalendarSlotBooking[] = [];
    const intro_bookings: MonthCalendarSlotBooking[] = [];
    const other_bookings: MonthCalendarSlotBooking[] = [];

    for (const item of hour_bookings) {
      increment_count(counts, item.kind);
      const slot_booking = to_slot_booking(item);
      if (item.kind === 'reformer') reformer.push(slot_booking);
      else if (item.kind === 'mat') mat.push(slot_booking);
      else if (item.kind === 'private') private_bookings.push(slot_booking);
      else if (item.kind === 'intro') intro_bookings.push(slot_booking);
      else other_bookings.push(slot_booking);
    }

    return {
      hour,
      time_label: String(hour).padStart(2, '0'),
      counts,
      reformer,
      mat,
      other: [...private_bookings, ...intro_bookings, ...other_bookings],
    };
  });
}

export function accessible_day_label(day: MonthCalendarDay): string {
  const parsed = parse_date_key(day.date_key);
  const day_number = parsed.getDate();
  const month = parsed.toLocaleDateString('en-GB', { month: 'long' });
  return `${day_number} ${month}, ${format_type_counts_label(day.counts)}`;
}

export function current_studio_year_month(now = new Date()): { year: number; month: number } {
  const key = studio_date_key(now);
  const [year, month] = key.split('-').map(Number);
  return { year: year ?? now.getFullYear(), month: month ?? now.getMonth() + 1 };
}
