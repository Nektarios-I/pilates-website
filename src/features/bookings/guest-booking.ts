/**
 * Staff guest-booking helpers — validation, payload hashing, and display rules.
 * Server RPC remains authoritative for capacity and authorization.
 */

export const GUEST_LABEL_MAX_LENGTH = 80;
export const GUEST_NOTE_MAX_LENGTH = 500;
export const GUEST_FEATURE_GATE = 'staff_guest_bookings';

export type GuestAttendeeKind = 'client' | 'guest';

export type GuestAttendeeInput = {
  label: string;
  note?: string | null;
};

export type GuestAttendeeNormalized = {
  label: string;
  note: string | null;
};

export type GuestBookingResult = {
  session_id: string;
  booking_ids: string[];
  already_booked: boolean;
  places_remaining: number;
};

/** Reject ASCII control characters (including newlines/tabs). Allow ordinary Unicode letters. */
export function contains_disallowed_control_chars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function normalize_guest_label(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function normalize_guest_note(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  return trimmed.length === 0 ? null : trimmed;
}

export function validate_guest_label(raw: string): { ok: true; label: string } | { ok: false; error: string } {
  // Reject controls on the raw value before whitespace collapse would turn newlines into spaces.
  if (contains_disallowed_control_chars(raw)) {
    return { ok: false, error: 'Guest labels cannot include line breaks or control characters.' };
  }
  const label = normalize_guest_label(raw);
  if (label.length < 1) return { ok: false, error: 'Enter a name or label for each guest.' };
  if (label.length > GUEST_LABEL_MAX_LENGTH) {
    return { ok: false, error: `Guest labels can be at most ${GUEST_LABEL_MAX_LENGTH} characters.` };
  }
  return { ok: true, label };
}

export function validate_guest_note(
  raw: string | null | undefined,
): { ok: true; note: string | null } | { ok: false; error: string } {
  if (raw != null && contains_disallowed_control_chars(raw)) {
    return { ok: false, error: 'Guest notes cannot include line breaks or control characters.' };
  }
  const note = normalize_guest_note(raw);
  if (note == null) return { ok: true, note: null };
  if (note.length > GUEST_NOTE_MAX_LENGTH) {
    return { ok: false, error: `Guest notes can be at most ${GUEST_NOTE_MAX_LENGTH} characters.` };
  }
  return { ok: true, note };
}

export function normalize_guest_attendees(
  guests: GuestAttendeeInput[],
): { ok: true; guests: GuestAttendeeNormalized[] } | { ok: false; error: string } {
  if (!Array.isArray(guests) || guests.length < 1) {
    return { ok: false, error: 'Add at least one guest.' };
  }

  const normalized: GuestAttendeeNormalized[] = [];
  for (let i = 0; i < guests.length; i += 1) {
    const label_result = validate_guest_label(guests[i]?.label ?? '');
    if (!label_result.ok) return { ok: false, error: `Guest ${i + 1}: ${label_result.error}` };
    const note_result = validate_guest_note(guests[i]?.note);
    if (!note_result.ok) return { ok: false, error: `Guest ${i + 1}: ${note_result.error}` };
    normalized.push({ label: label_result.label, note: note_result.note });
  }
  return { ok: true, guests: normalized };
}

/** Deterministic payload for request idempotency (must match SQL normalization). */
export function guest_booking_payload_canonical(input: {
  session_card_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  guests: GuestAttendeeNormalized[];
}): string {
  const guests = input.guests.map((guest) => ({
    label: guest.label,
    note: guest.note,
  }));
  return JSON.stringify({
    session_card_id: input.session_card_id,
    schedule_date: input.schedule_date,
    start_time: input.start_time.slice(0, 5),
    end_time: input.end_time.slice(0, 5),
    guests,
  });
}

export async function hash_guest_booking_payload(canonical: string): Promise<string> {
  const data = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function is_guest_attendee_kind(value: string | null | undefined): boolean {
  return value === 'guest';
}

export function guest_display_name(options: {
  attendee_kind?: string | null;
  guest_label?: string | null;
  client_name?: string | null;
}): string {
  if (is_guest_attendee_kind(options.attendee_kind)) {
    return options.guest_label?.trim() || 'Guest';
  }
  return options.client_name?.trim() || 'Unnamed client';
}

export function count_active_guests(
  rows: ReadonlyArray<{ counts_as_active?: boolean; attendee_kind?: string | null; status?: string }>,
): number {
  return rows.filter((row) => {
    if (row.counts_as_active === false) return false;
    if (row.counts_as_active === true) return is_guest_attendee_kind(row.attendee_kind);
    const active = ['booked', 'waitlisted', 'attended', 'finished'].includes(row.status ?? '');
    return active && is_guest_attendee_kind(row.attendee_kind);
  }).length;
}

export function format_guest_subset_suffix(guest_count: number): string {
  if (guest_count <= 0) return '';
  if (guest_count === 1) return ' · 1 guest';
  return ` · ${guest_count} guests`;
}

export function format_compact_guest_subset_suffix(guest_count: number): string {
  if (guest_count <= 0) return '';
  return ` · ${guest_count}G`;
}

export function guest_refund_applies(attendee_kind: string | null | undefined): boolean {
  return !is_guest_attendee_kind(attendee_kind);
}

export function guest_not_attended_allowed(attendee_kind: string | null | undefined): boolean {
  return !is_guest_attendee_kind(attendee_kind);
}

export function new_guest_request_id(): string {
  return crypto.randomUUID();
}
