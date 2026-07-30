import type {
  RecurringBookingState,
  RecurringTokenHealth,
} from '@/features/client-booking-manager/types';

export type PlannedSlotRow = {
  rule_id: string;
  rule_label: string;
  session_card_title: string;
  occurrence_date: string;
  start_time: string;
  occurrence_starts_at: string;
  occurrence_ends_at: string;
  booking_state: RecurringBookingState | 'skipped' | string | null;
  token_health: RecurringTokenHealth | 'package_expires_before' | string | null;
  failure_message: string | null;
};

/** Client-facing status for a planned recurring slot. */
export function planned_slot_status_label(
  booking_state: string | null | undefined,
  token_health: string | null | undefined,
): string {
  if (booking_state === 'booked') return 'Booked';
  if (booking_state === 'skipped') return 'Skipped';
  if (booking_state === 'failed') return 'Needs attention';
  if (token_health === 'insufficient_tokens') return 'Needs attention';
  if (token_health === 'package_expires_before') return 'Needs attention';
  if (booking_state === 'planned') return 'Planned';
  return 'Planned';
}

export function planned_slot_detail_label(
  booking_state: string | null | undefined,
  token_health: string | null | undefined,
  failure_message: string | null | undefined,
): string | null {
  if (booking_state === 'booked') {
    return 'Reserved for you';
  }
  if (booking_state === 'skipped') {
    return failure_message ?? 'This date was skipped';
  }
  if (token_health === 'package_expires_before') {
    return 'Package expires before this class date';
  }
  if (token_health === 'insufficient_tokens' || booking_state === 'failed') {
    return failure_message ?? 'Not enough package credits for this class';
  }
  if (booking_state === 'planned') {
    return 'Usually reserved about two weeks ahead';
  }
  return failure_message ?? null;
}

export function planned_slot_needs_attention(
  booking_state: string | null | undefined,
  token_health: string | null | undefined,
): boolean {
  return (
    booking_state === 'failed' ||
    token_health === 'insufficient_tokens' ||
    token_health === 'package_expires_before'
  );
}
