'use server';

import {
  DEFAULT_STAFF_BOOKING_FILTERS,
  filter_staff_bookings_by_search,
  is_valid_session_date_range,
  map_staff_booking,
  sort_staff_bookings_by_session_start,
  STAFF_BOOKINGS_LIMIT,
  type StaffBookingFilters,
  type StaffBookingRecord,
} from '@/features/bookings/staff-bookings';
import { createClient } from '@/lib/supabase/server';

export type StaffBookingsListResult = {
  bookings: StaffBookingRecord[];
  error: string | null;
};

const BOOKINGS_SELECT = `
  id,
  status,
  booked_at,
  cancelled_at,
  cancellation_reason,
  credits_used,
  profiles!inner (
    full_name,
    email
  ),
  sessions!inner (
    title,
    starts_at,
    ends_at,
    session_type,
    location,
    credits_required,
    reformer_credits_required,
    mat_credits_required
  ),
  booking_credit_charges (
    class_type,
    credits_used
  )
`;

async function resolve_admin_or_owner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  return (roles ?? []).some((row) => row.role === 'owner' || row.role === 'admin');
}

export async function list_staff_bookings(
  filters: StaffBookingFilters = DEFAULT_STAFF_BOOKING_FILTERS,
): Promise<StaffBookingsListResult> {
  if (!(await resolve_admin_or_owner())) {
    return { bookings: [], error: null };
  }

  if (!is_valid_session_date_range(filters.session_start_date, filters.session_end_date)) {
    return {
      bookings: [],
      error: 'Session end date must be on or after the start date.',
    };
  }

  const supabase = await createClient();
  let query = supabase
    .from('bookings')
    .select(BOOKINGS_SELECT)
    .order('starts_at', { foreignTable: 'sessions', ascending: false })
    .limit(STAFF_BOOKINGS_LIMIT);

  const now_iso = new Date().toISOString();

  if (filters.status === 'booked') {
    query = query.eq('status', 'booked');
  } else if (filters.status === 'cancelled') {
    query = query.eq('status', 'cancelled');
  } else if (filters.status === 'finished') {
    query = query.neq('status', 'cancelled').lt('sessions.starts_at', now_iso);
  }

  if (filters.session_start_date) {
    query = query.gte('sessions.starts_at', `${filters.session_start_date}T00:00:00`);
  }

  if (filters.session_end_date) {
    query = query.lte('sessions.starts_at', `${filters.session_end_date}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[list_staff_bookings] query failed:', error.message);
    return {
      bookings: [],
      error: 'Unable to load bookings. Please try again.',
    };
  }

  const mapped = (data ?? [])
    .map((row) => map_staff_booking(row))
    .filter((row): row is StaffBookingRecord => row !== null);

  const searched = filter_staff_bookings_by_search(mapped, filters.search);

  return {
    bookings: sort_staff_bookings_by_session_start(searched),
    error: null,
  };
}
