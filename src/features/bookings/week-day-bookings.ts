import {
  add_days,
  parse_date_key,
  start_of_week_monday,
  studio_date_key,
  to_date_key,
} from '@/lib/schedule/studio-hours';

import {
  format_session_type,
  studio_time_from_iso,
  type DayBookingsSession,
} from './day-bookings';

export type WeekSessionDetail = {
  id: string;
  title: string;
  session_type: string;
  session_type_label: string;
  starts_at: string;
  ends_at: string;
};

/** One client row inside an expanded weekly time slot. */
export type WeekSlotAttendee = {
  id: string;
  client_name: string;
  session_type: string;
  session_type_label: string;
};

export type WeekTimeSlot = {
  key: string;
  time_label: string;
  starts_at: string;
  ends_at: string;
  session_count: number;
  sessions: WeekSessionDetail[];
  /** Active clients across sessions in this exact time range. */
  attendees: WeekSlotAttendee[];
};

export type WeekDayOverview = {
  date_key: string;
  weekday_short: string;
  day_number: number;
  is_today: boolean;
  session_count: number;
  slots: WeekTimeSlot[];
};

export type WeekSessionsOverview = {
  monday_key: string;
  sunday_key: string;
  range_label: string;
  total_sessions: number;
  days: WeekDayOverview[];
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

export function monday_date_key_for(date_key: string): string {
  return to_date_key(start_of_week_monday(parse_date_key(date_key)));
}

export function week_date_keys(monday_key: string): string[] {
  const monday = parse_date_key(monday_key);
  return Array.from({ length: 7 }, (_, index) => to_date_key(add_days(monday, index)));
}

/** Naive local-wall bounds matching day bookings query style. */
export function studio_week_window_bounds(monday_key: string): {
  week_start: string;
  week_end: string;
} {
  const sunday_key = to_date_key(add_days(parse_date_key(monday_key), 6));
  return {
    week_start: `${monday_key}T00:00:00`,
    week_end: `${sunday_key}T23:59:59`,
  };
}

export function shift_date_key_by_days(date_key: string, days: number): string {
  return to_date_key(add_days(parse_date_key(date_key), days));
}

export function format_session_count_label(count: number): string {
  if (count === 0) return 'No sessions';
  if (count === 1) return '1 session';
  return `${count} sessions`;
}

function format_day_month(date_key: string, include_year: boolean): string {
  const [year, month, day] = date_key.split('-').map(Number);
  const month_name = MONTH_NAMES[month - 1] ?? '';
  if (include_year) return `${day} ${month_name} ${year}`;
  return `${day} ${month_name}`;
}

export function format_week_range_label(monday_key: string): string {
  const sunday_key = to_date_key(add_days(parse_date_key(monday_key), 6));
  const [start_year, start_month, start_day] = monday_key.split('-').map(Number);
  const [end_year, end_month, end_day] = sunday_key.split('-').map(Number);

  if (start_year === end_year && start_month === end_month) {
    const month_name = MONTH_NAMES[start_month - 1] ?? '';
    return `${start_day}–${end_day} ${month_name} ${start_year}`;
  }

  if (start_year === end_year) {
    return `${format_day_month(monday_key, false)} – ${format_day_month(sunday_key, false)} ${start_year}`;
  }

  return `${format_day_month(monday_key, true)} – ${format_day_month(sunday_key, true)}`;
}

function session_date_key(starts_at: string): string {
  return studio_date_key(new Date(starts_at));
}

function slot_time_label(starts_at: string, ends_at: string): string {
  return `${studio_time_from_iso(starts_at)}–${studio_time_from_iso(ends_at)}`;
}

function to_week_session_detail(session: DayBookingsSession): WeekSessionDetail {
  return {
    id: session.id,
    title: session.title,
    session_type: session.session_type,
    session_type_label: format_session_type(session.session_type),
    starts_at: session.starts_at,
    ends_at: session.ends_at,
  };
}

function attendees_from_session(session: DayBookingsSession): WeekSlotAttendee[] {
  const type_label = format_session_type(session.session_type);
  return session.active_bookings.map((booking) => ({
    id: booking.id,
    client_name: booking.client_name?.trim() || 'Unnamed client',
    session_type: session.session_type,
    session_type_label: type_label,
  }));
}

function group_day_slots(sessions: DayBookingsSession[]): WeekTimeSlot[] {
  const by_slot = new Map<string, WeekTimeSlot>();

  for (const session of sessions) {
    const time_label = slot_time_label(session.starts_at, session.ends_at);
    const key = `${studio_time_from_iso(session.starts_at)}|${studio_time_from_iso(session.ends_at)}`;
    const existing = by_slot.get(key);
    const session_detail = to_week_session_detail(session);
    const session_attendees = attendees_from_session(session);

    if (existing) {
      existing.sessions.push(session_detail);
      existing.session_count = existing.sessions.length;
      existing.attendees.push(...session_attendees);
      continue;
    }

    by_slot.set(key, {
      key,
      time_label,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      session_count: 1,
      sessions: [session_detail],
      attendees: session_attendees,
    });
  }

  return [...by_slot.values()]
    .map((slot) => ({
      ...slot,
      attendees: [...slot.attendees].sort((a, b) => {
        const type_cmp = a.session_type_label.localeCompare(b.session_type_label);
        if (type_cmp !== 0) return type_cmp;
        return a.client_name.localeCompare(b.client_name);
      }),
    }))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

export function build_week_sessions_overview(options: {
  monday_key: string;
  sessions: DayBookingsSession[];
  today_key?: string;
}): WeekSessionsOverview {
  const monday_key = monday_date_key_for(options.monday_key);
  const today_key = options.today_key ?? studio_date_key();
  const date_keys = week_date_keys(monday_key);
  const sunday_key = date_keys[6]!;

  const by_day = new Map<string, DayBookingsSession[]>();
  for (const key of date_keys) {
    by_day.set(key, []);
  }

  for (const session of options.sessions) {
    const day_key = session_date_key(session.starts_at);
    const bucket = by_day.get(day_key);
    if (!bucket) continue;
    bucket.push(session);
  }

  const days: WeekDayOverview[] = date_keys.map((date_key) => {
    const day_sessions = (by_day.get(date_key) ?? []).sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
    const parsed = parse_date_key(date_key);

    return {
      date_key,
      weekday_short: parsed.toLocaleDateString('en-GB', { weekday: 'short' }),
      day_number: parsed.getDate(),
      is_today: date_key === today_key,
      session_count: day_sessions.length,
      slots: group_day_slots(day_sessions),
    };
  });

  return {
    monday_key,
    sunday_key,
    range_label: format_week_range_label(monday_key),
    total_sessions: days.reduce((sum, day) => sum + day.session_count, 0),
    days,
  };
}
