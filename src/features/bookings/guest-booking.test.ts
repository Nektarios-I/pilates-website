import { describe, expect, it } from 'vitest';

import {
  count_active_guests,
  format_compact_guest_subset_suffix,
  format_guest_subset_suffix,
  guest_booking_payload_canonical,
  guest_display_name,
  guest_not_attended_allowed,
  guest_refund_applies,
  hash_guest_booking_payload,
  normalize_guest_attendees,
  validate_guest_label,
  validate_guest_note,
} from './guest-booking';

describe('guest label and note validation', () => {
  it('accepts ordinary Unicode names and collapses whitespace', () => {
    expect(validate_guest_label('  Μαρία   Ανδρέου ')).toEqual({
      ok: true,
      label: 'Μαρία Ανδρέου',
    });
  });

  it('rejects empty, overlong, and control characters without English-only regex', () => {
    expect(validate_guest_label('   ').ok).toBe(false);
    expect(validate_guest_label('a'.repeat(81)).ok).toBe(false);
    expect(validate_guest_label('Maria\nGuest').ok).toBe(false);
  });

  it('allows optional notes up to 500 characters', () => {
    expect(validate_guest_note(null)).toEqual({ ok: true, note: null });
    expect(validate_guest_note('  First visit  ')).toEqual({ ok: true, note: 'First visit' });
    expect(validate_guest_note('n'.repeat(501)).ok).toBe(false);
    expect(validate_guest_note('line\nbreak').ok).toBe(false);
  });

  it('requires at least one attendee and indexes errors', () => {
    expect(normalize_guest_attendees([]).ok).toBe(false);
    const bad = normalize_guest_attendees([{ label: '', note: 'ok' }]);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/Guest 1/i);
  });
});

describe('guest payload hashing', () => {
  it('hashes stable payload and treats note null consistently', async () => {
    const canonical = guest_booking_payload_canonical({
      session_card_id: 'card-1',
      schedule_date: '2026-11-01',
      start_time: '09:00:00',
      end_time: '10:00',
      guests: [{ label: 'Maria', note: null }],
    });
    expect(canonical).toContain('"start_time":"09:00"');
    const hash = await hash_guest_booking_payload(canonical);
    expect(hash).toHaveLength(64);
    expect(await hash_guest_booking_payload(canonical)).toBe(hash);
  });
});

describe('guest display and count helpers', () => {
  it('prefers guest_label for guests and falls back for clients', () => {
    expect(
      guest_display_name({ attendee_kind: 'guest', guest_label: 'Andreas', client_name: 'X' }),
    ).toBe('Andreas');
    expect(guest_display_name({ attendee_kind: 'client', client_name: 'Client A' })).toBe('Client A');
  });

  it('counts guest subset of active bookings once', () => {
    const count = count_active_guests([
      { counts_as_active: true, attendee_kind: 'client' },
      { counts_as_active: true, attendee_kind: 'guest' },
      { counts_as_active: true, attendee_kind: 'guest' },
      { counts_as_active: false, attendee_kind: 'guest', status: 'cancelled' },
      { counts_as_active: true, attendee_kind: 'guest', status: 'finished' },
    ]);
    expect(count).toBe(3);
    expect(format_guest_subset_suffix(2)).toBe(' · 2 guests');
    expect(format_guest_subset_suffix(1)).toBe(' · 1 guest');
    expect(format_compact_guest_subset_suffix(2)).toBe(' · 2G');
    expect(format_guest_subset_suffix(0)).toBe('');
  });

  it('blocks guest refund and Not attended helpers', () => {
    expect(guest_refund_applies('guest')).toBe(false);
    expect(guest_refund_applies('client')).toBe(true);
    expect(guest_not_attended_allowed('guest')).toBe(false);
    expect(guest_not_attended_allowed('client')).toBe(true);
  });
});
