export type NotAttendedClassType = 'reformer' | 'mat';

export type NotAttendedDecision =
  | { ok: true; class_type: NotAttendedClassType }
  | { ok: false; reason: string };

export type ClientBookingGroup =
  | 'upcoming'
  | 'in_progress'
  | 'finished'
  | 'cancelled'
  | 'no_show'
  | 'not_attended';

const REPLACEMENT_VALID_DAYS = 30;

export function evaluate_not_attended_eligibility(input: {
  now: Date;
  booking_status: string;
  session_status: string;
  session_ends_at: string;
  charge_count: number;
  credits_used: number | null;
  class_types: string[];
  attendee_kind?: string | null;
}): NotAttendedDecision {
  if (input.attendee_kind === 'guest') {
    return { ok: false, reason: 'Guest bookings cannot receive a replacement credit.' };
  }
  const session_ends_at = new Date(input.session_ends_at);
  if (session_ends_at > input.now) {
    return { ok: false, reason: 'The session has not ended.' };
  }
  if (input.session_status === 'cancelled') {
    return { ok: false, reason: 'The session is cancelled.' };
  }
  if (input.booking_status !== 'booked' && input.booking_status !== 'finished') {
    return { ok: false, reason: 'This booking status cannot be marked Not attended.' };
  }
  if (input.charge_count !== 1) {
    return { ok: false, reason: 'Not attended requires exactly one credit charge.' };
  }
  if (input.credits_used !== 1) {
    return { ok: false, reason: 'Not attended requires a single consumed credit.' };
  }
  if (input.class_types.length !== 1 || (input.class_types[0] !== 'reformer' && input.class_types[0] !== 'mat')) {
    return { ok: false, reason: 'Not attended requires one Reformer or Mat category.' };
  }
  return { ok: true, class_type: input.class_types[0] };
}

export function replacement_credit_expires_at(issued_at: Date): Date {
  const expires_at = new Date(issued_at);
  expires_at.setUTCDate(expires_at.getUTCDate() + REPLACEMENT_VALID_DAYS);
  return expires_at;
}

export function group_client_booking(input: {
  status: string;
  session_starts_at: string;
  session_ends_at: string;
  now: Date;
}): ClientBookingGroup {
  if (input.status === 'cancelled') return 'cancelled';
  if (input.status === 'no_show') return 'no_show';
  if (input.status === 'not_attended') return 'not_attended';
  if (input.status === 'finished' || input.status === 'attended') return 'finished';
  const starts_at = new Date(input.session_starts_at);
  const ends_at = new Date(input.session_ends_at);
  if (input.now >= ends_at) return 'finished';
  if (input.now >= starts_at) return 'in_progress';
  return 'upcoming';
}
