'use server';

import { createClient } from '@/lib/supabase/server';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BookingRow = {
  id: string;
  user_id: string;
  session_id: string;
  user_package_id: string;
  status: string;
  credits_used: number;
  booked_at: string;
};

export type BookResult =
  | { success: true; booking: BookingRow; status: 'booked' | 'waitlisted' }
  | { success: false; error: string; code?: string };

export type CancelResult =
  | { success: true; booking: BookingRow }
  | { success: false; error: string };

// ── book_session ──────────────────────────────────────────────────────────────
//
// Calls the book_session() Postgres function which:
//   • Validates the session is scheduled and hasn't started
//   • Validates the package belongs to the caller and has sufficient credits
//   • Determines booked vs waitlisted based on capacity
//   • Atomically deducts credits and inserts the booking row
//
// Error codes from the DB function:
//   P0001 Not authenticated   P0002 Session not found
//   P0003 Session not available  P0004 Session already started
//   P0005 Package not found   P0006 Package not active
//   P0007 Package expired     P0008 Insufficient credits

export async function book_session_action(
  session_id: string,
  reformer_package_id: string | null,
  mat_package_id?: string | null,
): Promise<BookResult> {
  const supabase = await createClient();

  const use_split_packages = mat_package_id !== undefined;

  const { data, error } = use_split_packages
    ? await supabase.rpc('book_session_with_credits', {
        p_session_id: session_id,
        p_reformer_user_package_id: reformer_package_id,
        p_mat_user_package_id: mat_package_id,
      })
    : await supabase.rpc('book_session', {
        p_session_id: session_id,
        p_user_package_id: reformer_package_id,
      });

  if (error) {
    // Map known Postgres error codes to friendly messages.
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
    };

    // Supabase wraps Postgres exceptions; check the detail/message for the code
    const raw = error.message ?? '';
    const matched_code = Object.keys(msg_map).find((code) => raw.includes(code));
    const friendly = matched_code ? msg_map[matched_code] : error.message;

    return { success: false, error: friendly, code: matched_code };
  }

  const booking = data as BookingRow;
  return {
    success: true,
    booking,
    status: booking.status as 'booked' | 'waitlisted',
  };
}

// ── cancel_booking ────────────────────────────────────────────────────────────
//
// Calls the cancel_booking() Postgres function which:
//   • Verifies the booking exists and belongs to the caller (or caller is admin/owner)
//   • Refunds credits to the package (for 'booked' status only — not waitlisted)
//   • Re-activates the package if it was used_up
//   • Marks the booking as 'cancelled'

export async function cancel_booking_action(
  booking_id: string,
  reason?: string,
): Promise<CancelResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: booking_id,
    p_reason: reason ?? 'Cancelled by client',
  });

  if (error) {
    const msg_map: Record<string, string> = {
      P0001: 'You must be signed in to cancel a booking.',
      P0010: 'That booking could not be found.',
      P0011: 'You are not authorised to cancel this booking.',
      P0012: 'This booking cannot be cancelled in its current state.',
    };

    const raw = error.message ?? '';
    const matched_code = Object.keys(msg_map).find((code) => raw.includes(code));
    const friendly = matched_code ? msg_map[matched_code] : error.message;

    return { success: false, error: friendly };
  }

  return { success: true, booking: data as BookingRow };
}
