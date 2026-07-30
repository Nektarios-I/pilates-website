/**
 * Shared session availability contract.
 *
 * Canonical capacity lives on `sessions.capacity`.
 * Live capacity-consuming bookings are only `status = 'booked'`
 * (matches private.book_session_core / public & staff booking RPCs).
 *
 * For staff day/history occupancy after finalize_past_bookings, past seats
 * may already be `finished` or staff-marked `attended` — those still represent
 * a taken place for roster display, but do not block new bookings (session is past).
 */

/** Statuses that consume a live bookable place (RPC capacity check). */
export const LIVE_CAPACITY_STATUSES = ['booked'] as const;

/**
 * Statuses that represent an occupied seat on a roster / day view,
 * including past auto-finalized and attendance-marked rows.
 */
export const OCCUPANCY_STATUSES = ['booked', 'finished', 'attended'] as const;

export type SessionAvailability = {
  capacity: number;
  confirmed_count: number;
  spots_left: number;
  is_full: boolean;
  /** False when capacity is missing/invalid — hide availability chrome. */
  should_display: boolean;
};

export type AvailabilityLabelMode = 'remaining' | 'occupancy';

/**
 * Prefer the materialized session capacity; otherwise use the session-card
 * capacity from the dataset. Never invent a hardcoded studio size.
 */
export function resolve_slot_capacity(
  session_capacity: number | null | undefined,
  card_capacity: number | null | undefined,
): number {
  if (typeof session_capacity === 'number' && Number.isFinite(session_capacity) && session_capacity > 0) {
    return session_capacity;
  }
  if (typeof card_capacity === 'number' && Number.isFinite(card_capacity) && card_capacity > 0) {
    return card_capacity;
  }
  return 0;
}

export function build_session_availability(
  capacity: number | null | undefined,
  confirmed_count: number | null | undefined,
): SessionAvailability {
  const safe_capacity = typeof capacity === 'number' && Number.isFinite(capacity) ? capacity : 0;
  const raw_count =
    typeof confirmed_count === 'number' && Number.isFinite(confirmed_count)
      ? Math.max(0, confirmed_count)
      : 0;

  if (safe_capacity <= 0) {
    return {
      capacity: 0,
      confirmed_count: raw_count,
      spots_left: 0,
      is_full: false,
      should_display: false,
    };
  }

  const spots_left = Math.max(0, safe_capacity - raw_count);

  return {
    capacity: safe_capacity,
    confirmed_count: raw_count,
    spots_left,
    is_full: raw_count >= safe_capacity,
    should_display: true,
  };
}

export function count_occupying_bookings(
  statuses: readonly string[],
  mode: 'live' | 'occupancy' = 'live',
): number {
  const allowed =
    mode === 'live'
      ? (LIVE_CAPACITY_STATUSES as readonly string[])
      : (OCCUPANCY_STATUSES as readonly string[]);
  return statuses.filter((status) => allowed.includes(status)).length;
}

/** Client-facing: “2 spots left” / “1 spot left” / “Full”. */
export function format_remaining_spots_label(availability: SessionAvailability): string | null {
  if (!availability.should_display) return null;
  if (availability.is_full) return 'Full';
  if (availability.spots_left === 1) return '1 spot left';
  return `${availability.spots_left} spots left`;
}

/** Staff-facing: “3 / 6 booked” / “Full”. */
export function format_occupancy_label(availability: SessionAvailability): string | null {
  if (!availability.should_display) return null;
  if (availability.is_full) return 'Full';
  return `${availability.confirmed_count} / ${availability.capacity} booked`;
}

export function format_availability_label(
  availability: SessionAvailability,
  mode: AvailabilityLabelMode,
): string | null {
  return mode === 'occupancy'
    ? format_occupancy_label(availability)
    : format_remaining_spots_label(availability);
}

/** Accessible description for icons / compact controls. */
export function availability_accessible_label(
  availability: SessionAvailability,
  mode: AvailabilityLabelMode = 'remaining',
): string | null {
  if (!availability.should_display) return null;
  if (availability.is_full) {
    return `Session full, ${availability.capacity} of ${availability.capacity} places taken`;
  }
  if (mode === 'occupancy') {
    return `${availability.confirmed_count} of ${availability.capacity} places booked`;
  }
  return `${availability.spots_left} of ${availability.capacity} places remaining`;
}
