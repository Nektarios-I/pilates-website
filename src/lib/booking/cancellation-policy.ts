/**
 * Client-facing booking cancellation policy (2-hour cutoff).
 * Backend enforcement lives in cancel_booking (P0029); staff may override.
 */

export const CLIENT_CANCELLATION_CUTOFF_MS = 2 * 60 * 60 * 1000;

export const CANCELLATION_POLICY_SHORT =
  'Cancel more than 2 hours before class to restore your credit.';

export const CANCELLATION_POLICY_BOOKING =
  'You can cancel online more than 2 hours before class. Inside 2 hours, the session credit is kept.';

export const CANCELLATION_POLICY_FAQ =
  'Cancel online more than 2 hours before class start to restore your session credit. Inside 2 hours, online cancellation is not available and the credit is kept.';

export function client_may_cancel_online(session_starts_at: string, now = Date.now()): boolean {
  // Matches cancel_booking SQL: blocked when starts_at <= now() + interval '2 hours'
  return new Date(session_starts_at).getTime() - now > CLIENT_CANCELLATION_CUTOFF_MS;
}

/** True when backend would reject client self-cancel with P0029. */
export function client_cancel_blocked_by_cutoff(session_starts_at: string, now = Date.now()): boolean {
  return !client_may_cancel_online(session_starts_at, now);
}

export function cancellation_blocked_message(): string {
  return 'Online cancellation closes 2 hours before class. Your session credit is kept for this booking.';
}

export function session_is_full_for_public_booking(
  confirmed_count: number,
  capacity: number,
): boolean {
  return confirmed_count >= capacity;
}
