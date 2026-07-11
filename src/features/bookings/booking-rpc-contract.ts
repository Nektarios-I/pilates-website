/**
 * Booking RPC contracts — documents defaults and error codes for SQL migrations
 * 19–21. Used by unit tests to guard public vs staff behavior expectations.
 */

export const BOOKING_ERROR_CODES = {
  not_authenticated: 'P0001',
  session_not_found: 'P0002',
  session_unavailable: 'P0003',
  session_started: 'P0004',
  package_not_found: 'P0005',
  package_inactive: 'P0006',
  package_expired: 'P0007',
  insufficient_credits: 'P0008',
  package_type_mismatch: 'P0009',
  booking_not_found: 'P0010',
  not_authorised: 'P0011',
  cannot_cancel_status: 'P0012',
  slot_conflict: 'P0013',
  booking_horizon: 'P0014',
  recurring_priority: 'P0032',
  session_at_capacity: 'P0015',
  invalid_booking_source: 'P0016',
  target_not_client: 'P0017',
  packages_not_authorised: 'P0020',
  cancellation_cutoff: 'P0029',
} as const;

export const CLIENT_CANCELLATION_CUTOFF_HOURS = 2;

export type BookingSource = 'client' | 'staff_manual' | 'recurring';

export type BookSessionCoreFlags = {
  allow_waitlist: boolean;
  enforce_public_horizon: boolean;
  booking_source: BookingSource;
  created_by_user_id: string | null;
  recurring_materialization_log_id: string | null;
};

/** Public wrappers — full sessions fail; no waitlist; 14-day horizon + recurring gate. */
export const PUBLIC_BOOK_SESSION_CORE_FLAGS: BookSessionCoreFlags = {
  allow_waitlist: false,
  enforce_public_horizon: true,
  booking_source: 'client',
  created_by_user_id: null,
  recurring_materialization_log_id: null,
};

/** Staff manual booking — fail on full capacity, write staff provenance. */
export function staff_manual_book_session_core_flags(staff_user_id: string): BookSessionCoreFlags {
  return {
    allow_waitlist: false,
    enforce_public_horizon: true,
    booking_source: 'staff_manual',
    created_by_user_id: staff_user_id,
    recurring_materialization_log_id: null,
  };
}

export function map_postgres_booking_error(raw_message: string): {
  code: string | undefined;
  friendly: string;
} {
  const msg_map: Record<string, string> = {
    P0001: 'You must be signed in to book a session.',
    P0002: 'That session could not be found.',
    P0003: 'This session is no longer available for booking.',
    P0004: 'This session has already started and cannot be booked.',
    P0005: 'The selected package could not be found or does not belong to your account.',
    P0006: 'The selected package is not active.',
    P0007: 'The selected package has expired.',
    P0008: 'You do not have enough credits in this package for this session.',
    P0009: 'The selected package is for a different class type.',
    P0013: 'You already have a booking at this time. You can book other sessions the same day, but not two classes at the same time.',
    P0014: 'You can only book up to 14 days in advance.',
    P0015: 'This session is full and cannot be booked.',
    P0032: 'This time is reserved until recurring prebookings are processed for this date.',
    P0017: 'Bookings can only be created for client accounts.',
    P0029: 'Online cancellation closes 2 hours before class. Your session credit is kept for this booking.',
  };

  const matched_code = Object.keys(msg_map).find((code) => raw_message.includes(code));
  return {
    code: matched_code,
    friendly: matched_code ? msg_map[matched_code] : raw_message,
  };
}

export function credits_deducted_for_status(status: string): boolean {
  return status === 'booked';
}

export function refund_applies_for_cancelled_status(original_status: string): boolean {
  return original_status === 'booked';
}

export function staff_may_view_packages_for_user(
  caller_user_id: string,
  target_user_id: string,
  caller_is_staff: boolean,
): boolean {
  if (caller_user_id === target_user_id) return true;
  return caller_is_staff;
}

export const RECURRING_MATERIALIZATION_HORIZON_DAYS = 14;

export const PUBLIC_BOOKING_HORIZON_DAYS = RECURRING_MATERIALIZATION_HORIZON_DAYS;

export type RecurringHealthStatus = 'ready' | 'insufficient_tokens' | 'failed';

export type RecurringMaterializationFlags = {
  allow_waitlist: boolean;
  enforce_public_horizon: boolean;
  booking_source: 'recurring';
  created_by_user_id: null;
};

/** Automated recurring materialization — no waitlist, no staff actor on booking. */
export const RECURRING_MATERIALIZATION_FLAGS: RecurringMaterializationFlags = {
  allow_waitlist: false,
  enforce_public_horizon: false,
  booking_source: 'recurring',
  created_by_user_id: null,
};

export function occurrence_within_materialization_window(
  occurrence_date: string,
  studio_today: string,
  horizon_days = RECURRING_MATERIALIZATION_HORIZON_DAYS,
): boolean {
  const start = new Date(`${studio_today}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + horizon_days);
  const occurrence = new Date(`${occurrence_date}T00:00:00`);
  return occurrence >= start && occurrence <= end;
}

export function recurring_provenance_on_success(log_id: string) {
  return {
    booking_source: 'recurring' as const,
    created_by_user_id: null,
    recurring_materialization_log_id: log_id,
  };
}

export function staff_may_cancel_booking(
  caller_user_id: string,
  booking_user_id: string,
  caller_is_staff: boolean,
): boolean {
  if (caller_user_id === booking_user_id) return true;
  return caller_is_staff;
}
