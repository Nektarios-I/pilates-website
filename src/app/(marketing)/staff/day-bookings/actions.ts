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

const BOOKINGS_WITH_SESSION_SELECT = `
  id,
  status,
  booked_at,
  cancelled_at,
  session_id,
  profiles!inner (
    full_name,
    email
  ),
  sessions!inner (
    id,
    title,
    starts_at,
    ends_at,
    session_type,
    location,
    status,
    instructor:profiles!sessions_instructor_id_fkey (
      full_name
    )
  )
`;

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
  const day_start = `${filters.date_key}T00:00:00`;
  const day_end = `${filters.date_key}T23:59:59`;

  const { data: booking_rows, error: bookings_error } = await supabase
    .from('bookings')
    .select(BOOKINGS_WITH_SESSION_SELECT)
    .gte('sessions.starts_at', day_start)
    .lte('sessions.starts_at', day_end)
    .in('sessions.status', ['scheduled', 'completed'])
    .order('booked_at', { ascending: true });

  if (bookings_error) {
    console.error('[list_day_bookings] query failed:', bookings_error.message);
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
