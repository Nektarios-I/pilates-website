'use server';

import {
  DEFAULT_DAY_BOOKINGS_FILTERS,
  group_day_bookings_from_rows,
  parse_hour_minutes,
  session_starts_in_hour_range,
  summarize_day_bookings,
  type DayBookingsFilters,
  type DayBookingsSession,
  type DayBookingsSummary,
} from '@/features/bookings/day-bookings';
import {
  build_month_calendar_overview,
  map_month_calendar_booking,
  studio_month_grid_window_bounds,
  type MonthCalendarOverview,
} from '@/features/bookings/month-calendar';
import {
  log_staff_booking_query_error,
  STAFF_DAY_BOOKINGS_SELECT,
  STAFF_MONTH_CALENDAR_SELECT,
  studio_day_window_bounds,
} from '@/features/bookings/staff-booking-queries';
import {
  build_week_sessions_overview,
  monday_date_key_for,
  studio_week_window_bounds,
  type WeekSessionsOverview,
} from '@/features/bookings/week-day-bookings';
import { createClient } from '@/lib/supabase/server';

const STAFF_ROLES = ['instructor', 'owner', 'admin'] as const;

type StaffCaller = {
  user_id: string;
};

async function resolve_teaching_staff(): Promise<StaffCaller | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role_values = (roles ?? []).map((row) => row.role);
  const is_staff = role_values.some((role) =>
    (STAFF_ROLES as readonly string[]).includes(role),
  );
  if (!is_staff) return null;

  return { user_id: user.id };
}

export type DayBookingsListResult = {
  sessions: DayBookingsSession[];
  summary: DayBookingsSummary;
  error: string | null;
};

export async function list_day_bookings(
  filters: DayBookingsFilters = DEFAULT_DAY_BOOKINGS_FILTERS,
): Promise<DayBookingsListResult> {
  const empty: DayBookingsListResult = {
    sessions: [],
    summary: { sessions: 0, active: 0, cancelled: 0 },
    error: null,
  };

  const caller = await resolve_teaching_staff();
  if (!caller) return empty;

  if (parse_hour_minutes(filters.hour_end) <= parse_hour_minutes(filters.hour_start)) {
    return {
      ...empty,
      error: 'The end hour must be after the start hour.',
    };
  }

  const supabase = await createClient();
  const { day_start, day_end } = studio_day_window_bounds(filters.date_key);

  const { data: booking_rows, error: bookings_error } = await supabase
    .from('bookings')
    .select(STAFF_DAY_BOOKINGS_SELECT)
    .gte('sessions.starts_at', day_start)
    .lte('sessions.starts_at', day_end)
    .in('sessions.status', ['scheduled', 'completed'])
    .order('booked_at', { ascending: true });

  if (bookings_error) {
    log_staff_booking_query_error('list_day_bookings', bookings_error);
    return {
      ...empty,
      error: 'Unable to load bookings for this day. Please try again.',
    };
  }

  const grouped = group_day_bookings_from_rows(booking_rows ?? []);

  const sessions = grouped.filter((session) =>
    session_starts_in_hour_range(session.starts_at, filters.hour_start, filters.hour_end),
  );

  return {
    sessions,
    summary: summarize_day_bookings(sessions),
    error: null,
  };
}

export type WeekDayBookingsListResult = {
  overview: WeekSessionsOverview;
  error: string | null;
};

/**
 * Single-query week load: same access, select, session statuses, grouping, and
 * hour-range filtering as `list_day_bookings`, over Monday–Sunday.
 */
export async function list_week_day_bookings(
  filters: DayBookingsFilters = DEFAULT_DAY_BOOKINGS_FILTERS,
): Promise<WeekDayBookingsListResult> {
  const monday_key = monday_date_key_for(filters.date_key);
  const empty_overview = build_week_sessions_overview({
    monday_key,
    sessions: [],
  });

  const caller = await resolve_teaching_staff();
  if (!caller) {
    return { overview: empty_overview, error: null };
  }

  if (parse_hour_minutes(filters.hour_end) <= parse_hour_minutes(filters.hour_start)) {
    return {
      overview: empty_overview,
      error: 'The end hour must be after the start hour.',
    };
  }

  const supabase = await createClient();
  const { week_start, week_end } = studio_week_window_bounds(monday_key);

  const { data: booking_rows, error: bookings_error } = await supabase
    .from('bookings')
    .select(STAFF_DAY_BOOKINGS_SELECT)
    .gte('sessions.starts_at', week_start)
    .lte('sessions.starts_at', week_end)
    .in('sessions.status', ['scheduled', 'completed'])
    .order('booked_at', { ascending: true });

  if (bookings_error) {
    log_staff_booking_query_error('list_week_day_bookings', bookings_error);
    return {
      overview: empty_overview,
      error: 'Unable to load bookings for this week. Please try again.',
    };
  }

  const grouped = group_day_bookings_from_rows(booking_rows ?? []);
  const sessions = grouped.filter((session) =>
    session_starts_in_hour_range(session.starts_at, filters.hour_start, filters.hour_end),
  );

  return {
    overview: build_week_sessions_overview({ monday_key, sessions }),
    error: null,
  };
}

export type MonthCalendarListResult = {
  overview: MonthCalendarOverview;
  error: string | null;
};

function empty_month_overview(year: number, month: number): MonthCalendarOverview {
  return build_month_calendar_overview({ year, month, bookings: [] });
}

/**
 * Independent month load for the Month Calendar. Same staff gate and session
 * statuses as day bookings, but no hour-range filter and a dedicated select
 * that includes user_id for the client-detail popup.
 */
export async function list_month_calendar(
  year: number,
  month: number,
): Promise<MonthCalendarListResult> {
  const empty: MonthCalendarListResult = {
    overview: empty_month_overview(year, month),
    error: null,
  };

  const caller = await resolve_teaching_staff();
  if (!caller) return empty;

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { ...empty, error: 'Choose a valid month and year.' };
  }

  const supabase = await createClient();
  const { range_start, range_end } = studio_month_grid_window_bounds(year, month);

  const { data: booking_rows, error: bookings_error } = await supabase
    .from('bookings')
    .select(STAFF_MONTH_CALENDAR_SELECT)
    .gte('sessions.starts_at', range_start)
    .lte('sessions.starts_at', range_end)
    .in('sessions.status', ['scheduled', 'completed'])
    .order('booked_at', { ascending: true });

  if (bookings_error) {
    log_staff_booking_query_error('list_month_calendar', bookings_error);
    return {
      ...empty,
      error: 'Unable to load the month calendar. Please try again.',
    };
  }

  const bookings = (booking_rows ?? [])
    .map((row) => map_month_calendar_booking(row))
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return {
    overview: build_month_calendar_overview({ year, month, bookings }),
    error: null,
  };
}
