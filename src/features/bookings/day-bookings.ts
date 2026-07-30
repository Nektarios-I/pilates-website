import { STUDIO_TIMEZONE, studio_date_key } from '@/lib/schedule/studio-hours';

import {
  format_booking_time,
  related_booking_row,
  type BookingStatus,
} from './staff-bookings';

export const ACTIVE_BOOKING_STATUSES = ['booked', 'waitlisted', 'attended', 'finished'] as const;
export const CANCELLED_BOOKING_STATUSES = ['cancelled', 'no_show'] as const;

export type DayBookingsFilters = {
  date_key: string;
  hour_start: string;
  hour_end: string;
};

export const DEFAULT_DAY_BOOKINGS_FILTERS: DayBookingsFilters = {
  date_key: studio_date_key(),
  hour_start: '06:00',
  hour_end: '22:00',
};

export const DAY_BOOKING_HOUR_OPTIONS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
] as const;

export type DayBookingAttendee = {
  id: string;
  status: BookingStatus;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  booked_at: string;
  cancelled_at: string | null;
};

export type DayBookingsSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  session_type: string;
  location: string | null;
  instructor_name: string | null;
  capacity: number;
  active_bookings: DayBookingAttendee[];
  cancelled_bookings: DayBookingAttendee[];
};

export type DayBookingsSummary = {
  sessions: number;
  active: number;
  cancelled: number;
};

export function parse_hour_minutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function studio_time_from_iso(iso: string, time_zone = STUDIO_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: time_zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function session_starts_in_hour_range(
  starts_at: string,
  hour_start: string,
  hour_end: string,
): boolean {
  const session_minutes = parse_hour_minutes(studio_time_from_iso(starts_at));
  const range_start = parse_hour_minutes(hour_start);
  const range_end = parse_hour_minutes(hour_end);

  if (range_end <= range_start) return false;

  return session_minutes >= range_start && session_minutes < range_end;
}

export function is_active_booking_status(status: string): boolean {
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(status);
}

export function is_cancelled_booking_status(status: string): boolean {
  return (CANCELLED_BOOKING_STATUSES as readonly string[]).includes(status);
}

type RawDayBookingRow = {
  id: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
  session_id: string;
  profiles:
    | { full_name: string | null; email: string | null; phone: string | null }
    | { full_name: string | null; email: string | null; phone: string | null }[];
};

export function map_day_booking_attendee(row: RawDayBookingRow): DayBookingAttendee | null {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  if (!profile) return null;
  if (!profile.email && !profile.phone && !profile.full_name) return null;

  const status = row.status as BookingStatus;
  if (!is_active_booking_status(status) && !is_cancelled_booking_status(status)) return null;

  return {
    id: row.id,
    status,
    client_name: profile.full_name,
    client_email: profile.email,
    client_phone: profile.phone ?? null,
    booked_at: row.booked_at,
    cancelled_at: row.cancelled_at,
  };
}

type RawDaySessionRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  session_type: string;
  location: string | null;
  capacity?: number | null;
  instructor: { full_name: string | null } | { full_name: string | null }[] | null;
};

export function map_day_session_row(
  row: RawDaySessionRow,
): Omit<DayBookingsSession, 'active_bookings' | 'cancelled_bookings'> {
  const instructor = Array.isArray(row.instructor) ? row.instructor[0] : row.instructor;

  return {
    id: row.id,
    title: row.title,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    session_type: row.session_type,
    location: row.location,
    instructor_name: instructor?.full_name ?? null,
    capacity: typeof row.capacity === 'number' && row.capacity > 0 ? row.capacity : 0,
  };
}

export function build_day_bookings_sessions(
  sessions: Omit<DayBookingsSession, 'active_bookings' | 'cancelled_bookings'>[],
  bookings_by_session: Map<string, DayBookingAttendee[]>,
): DayBookingsSession[] {
  return sessions.map((session) => {
    const session_bookings = bookings_by_session.get(session.id) ?? [];
    const active_bookings = session_bookings.filter((booking) =>
      is_active_booking_status(booking.status),
    );
    const cancelled_bookings = session_bookings.filter((booking) =>
      is_cancelled_booking_status(booking.status),
    );

    return {
      ...session,
      active_bookings,
      cancelled_bookings,
    };
  });
}

/** Operational day view: only sessions that actually have a roster. */
export function filter_sessions_with_bookings(sessions: DayBookingsSession[]): DayBookingsSession[] {
  return sessions.filter(
    (session) => session.active_bookings.length > 0 || session.cancelled_bookings.length > 0,
  );
}

export function dedupe_sessions_by_id<T extends { id: string }>(sessions: T[]): T[] {
  const seen = new Set<string>();
  return sessions.filter((session) => {
    if (seen.has(session.id)) return false;
    seen.add(session.id);
    return true;
  });
}

type RawBookingWithSessionRow = RawDayBookingRow & {
  sessions: RawDaySessionRow | RawDaySessionRow[] | null;
};

export function group_day_bookings_from_rows(rows: RawBookingWithSessionRow[]): DayBookingsSession[] {
  const by_session = new Map<string, DayBookingsSession>();

  for (const row of rows) {
    const session_row = related_booking_row(row.sessions);
    if (!session_row) continue;

    const attendee = map_day_booking_attendee(row);
    if (!attendee) continue;

    const session_base = map_day_session_row(session_row);
    let group = by_session.get(session_base.id);

    if (!group) {
      group = { ...session_base, active_bookings: [], cancelled_bookings: [] };
      by_session.set(session_base.id, group);
    }

    const roster =
      is_active_booking_status(attendee.status) ? group.active_bookings : group.cancelled_bookings;

    if (roster.some((entry) => entry.id === attendee.id)) continue;

    if (is_active_booking_status(attendee.status)) {
      group.active_bookings.push(attendee);
    } else if (is_cancelled_booking_status(attendee.status)) {
      group.cancelled_bookings.push(attendee);
    }
  }

  return [...by_session.values()].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
}

export function summarize_day_bookings(sessions: DayBookingsSession[]): DayBookingsSummary {
  return sessions.reduce(
    (summary, session) => ({
      sessions: summary.sessions + 1,
      active: summary.active + session.active_bookings.length,
      cancelled: summary.cancelled + session.cancelled_bookings.length,
    }),
    { sessions: 0, active: 0, cancelled: 0 },
  );
}

export function format_day_heading(date_key: string): string {
  const [year, month, day] = date_key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function format_session_time_range(starts_at: string, ends_at: string): string {
  return `${format_booking_time(starts_at)} – ${format_booking_time(ends_at)}`;
}

export {
  format_booking_status,
  format_booking_time,
  format_session_type,
} from './staff-bookings';
