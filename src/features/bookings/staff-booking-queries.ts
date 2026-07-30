/**
 * Shared PostgREST select fragments for staff booking list queries.
 *
 * After migration 18, `bookings` has two FKs to `profiles`
 * (`user_id` and `created_by_user_id`). Bare `profiles!inner` is ambiguous
 * (PGRST201). Always name the relationship when embedding the booked client.
 */

/** Explicit embed for the booked client (bookings.user_id → profiles). */
export const BOOKINGS_CLIENT_PROFILE_EMBED = `profiles!bookings_user_id_fkey!inner (
    full_name,
    email,
    phone
  )`;

/** Explicit embed for session instructor (sessions.instructor_id → profiles). */
export const SESSIONS_INSTRUCTOR_PROFILE_EMBED = `instructor:profiles!sessions_instructor_id_fkey (
      full_name
    )`;

/**
 * Staff booking history select — studio-wide roster with client + session + charges.
 */
export const STAFF_BOOKING_HISTORY_SELECT = `
  id,
  status,
  booked_at,
  cancelled_at,
  cancellation_reason,
  credits_used,
  ${BOOKINGS_CLIENT_PROFILE_EMBED},
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

/**
 * Staff day-bookings select — bookings joined to sessions with client + instructor.
 */
export const STAFF_DAY_BOOKINGS_SELECT = `
  id,
  status,
  booked_at,
  cancelled_at,
  session_id,
  ${BOOKINGS_CLIENT_PROFILE_EMBED},
  sessions!inner (
    id,
    title,
    starts_at,
    ends_at,
    session_type,
    location,
    status,
    capacity,
    ${SESSIONS_INSTRUCTOR_PROFILE_EMBED}
  )
`;

/** True when a select string embeds the booked client via the explicit user_id FK. */
export function uses_explicit_booking_client_profile_embed(select: string): boolean {
  return select.includes('profiles!bookings_user_id_fkey');
}

/**
 * True when a select still uses an ambiguous bare bookings→profiles embed.
 * Allows already-disambiguated instructor embeds on sessions.
 */
export function has_ambiguous_booking_profiles_embed(select: string): boolean {
  // Strip known-safe named embeds that also contain "profiles!"
  const without_safe = select
    .replace(/profiles!bookings_user_id_fkey(?:!inner)?/g, '')
    .replace(/profiles!bookings_created_by_user_id_fkey(?:!inner)?/g, '')
    .replace(/profiles!sessions_instructor_id_fkey(?:!inner)?/g, '');

  return /profiles!inner/.test(without_safe) || /(?:^|[^!])profiles\s*\(/.test(without_safe);
}

/**
 * Calendar-day filter bounds currently used by staff day/history queries.
 * These are naive local-wall strings (no timezone offset). Hour filtering for
 * day bookings is applied separately in studio timezone (Europe/Nicosia).
 */
export function studio_day_window_bounds(date_key: string): {
  day_start: string;
  day_end: string;
} {
  return {
    day_start: `${date_key}T00:00:00`,
    day_end: `${date_key}T23:59:59`,
  };
}

type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

/** Log actionable PostgREST diagnostics without exposing them to end users. */
export function log_staff_booking_query_error(
  context: string,
  error: SupabaseLikeError,
  logger: Pick<Console, 'error'> = console,
): void {
  const parts = [
    error.code ? `code=${error.code}` : null,
    error.message ? `message=${error.message}` : null,
    error.hint ? `hint=${error.hint}` : null,
    error.details ? `details=${error.details}` : null,
  ].filter(Boolean);

  logger.error(`[${context}] query failed: ${parts.join(' | ') || 'unknown error'}`);
}
