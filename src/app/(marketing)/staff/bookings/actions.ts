'use server';

import {
  BOOKING_STATUSES,
  DEFAULT_STAFF_BOOKING_FILTERS,
  is_valid_session_date_range,
  map_staff_booking,
  sort_staff_bookings_by_session_start,
  STAFF_BOOKINGS_LIMIT,
  type StaffBookingFilters,
  type StaffBookingRecord,
} from '@/features/bookings/staff-bookings';
import {
  log_staff_booking_query_error,
  STAFF_BOOKING_HISTORY_SELECT,
  studio_day_window_bounds,
} from '@/features/bookings/staff-booking-queries';
import { createClient } from '@/lib/supabase/server';

import {
  list_manageable_clients,
  type ManageableClient,
} from '../membership/actions';

export type StaffBookingsListResult = {
  bookings: StaffBookingRecord[];
  error: string | null;
};

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

/** Best-effort catch-up before listing so past booked rows show as finished. */
async function ensure_past_bookings_finalized(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const { error } = await supabase.rpc('finalize_past_bookings');
  if (error) {
    console.error('[list_staff_bookings] finalize_past_bookings failed:', error.message);
  }
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
  await ensure_past_bookings_finalized(supabase);

  let query = supabase
    .from('bookings')
    .select(STAFF_BOOKING_HISTORY_SELECT)
    .order('starts_at', { foreignTable: 'sessions', ascending: false })
    .limit(STAFF_BOOKINGS_LIMIT);

  if (filters.status !== 'all' && (BOOKING_STATUSES as readonly string[]).includes(filters.status)) {
    query = query.eq('status', filters.status);
  }

  if (filters.client_user_id) {
    query = query.eq('user_id', filters.client_user_id);
  }

  if (filters.session_start_date) {
    query = query.gte(
      'sessions.starts_at',
      studio_day_window_bounds(filters.session_start_date).day_start,
    );
  }

  if (filters.session_end_date) {
    query = query.lte(
      'sessions.starts_at',
      studio_day_window_bounds(filters.session_end_date).day_end,
    );
  }

  const { data, error } = await query;

  if (error) {
    log_staff_booking_query_error('list_staff_bookings', error);
    return {
      bookings: [],
      error: 'Unable to load bookings. Please try again.',
    };
  }

  const mapped = (data ?? [])
    .map((row) => map_staff_booking(row))
    .filter((row): row is StaffBookingRecord => row !== null);

  return {
    bookings: sort_staff_bookings_by_session_start(mapped),
    error: null,
  };
}

export async function list_booking_history_clients(): Promise<ManageableClient[]> {
  if (!(await resolve_admin_or_owner())) return [];
  return list_manageable_clients();
}
