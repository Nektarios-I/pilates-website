import { describe, expect, it } from 'vitest';

import {
  evaluate_not_attended_eligibility,
  group_client_booking,
  replacement_credit_expires_at,
} from './not-attended';

const NOW = new Date('2026-10-25T18:00:00.000Z');
const ENDED = '2026-10-25T17:00:00.000Z';
const FUTURE_END = '2026-10-25T19:00:00.000Z';

function eligible(overrides: Record<string, unknown> = {}) {
  return evaluate_not_attended_eligibility({
    now: NOW,
    booking_status: 'finished',
    session_status: 'scheduled',
    session_ends_at: ENDED,
    charge_count: 1,
    credits_used: 1,
    class_types: ['reformer'],
    ...overrides,
  });
}

describe('evaluate_not_attended_eligibility', () => {
  it('allows a finished booking after the session ends with one reformer credit', () => {
    expect(eligible()).toEqual({ ok: true, class_type: 'reformer' });
  });

  it('allows an ended booked booking', () => {
    expect(eligible({ booking_status: 'booked' })).toEqual({ ok: true, class_type: 'reformer' });
  });

  it('allows mat when that is the only charge category', () => {
    expect(eligible({ class_types: ['mat'] })).toEqual({ ok: true, class_type: 'mat' });
  });

  it.each([
    ['future booked', { booking_status: 'booked', session_ends_at: FUTURE_END }],
    ['in progress', { booking_status: 'booked', session_ends_at: FUTURE_END }],
    ['future finished', { booking_status: 'finished', session_ends_at: FUTURE_END }],
    ['cancelled session', { session_status: 'cancelled' }],
    ['cancelled booking', { booking_status: 'cancelled' }],
    ['attended', { booking_status: 'attended' }],
    ['waitlisted', { booking_status: 'waitlisted' }],
    ['no_show', { booking_status: 'no_show' }],
    ['missing charge', { charge_count: 0 }],
    ['multi charge', { charge_count: 2 }],
    ['multi credit', { credits_used: 2 }],
    ['unlimited', { credits_used: null }],
    ['mixed class types', { class_types: ['reformer', 'mat'] }],
  ])('rejects %s', (_label, overrides) => {
    const result = eligible(overrides);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });
});

describe('replacement_credit_expires_at', () => {
  it('expires 30 days after issuance', () => {
    expect(replacement_credit_expires_at(NOW).toISOString()).toBe('2026-11-24T18:00:00.000Z');
  });
});

describe('group_client_booking', () => {
  it('maps each stored status and time combination', () => {
    expect(group_client_booking({ status: 'booked', session_starts_at: FUTURE_END, session_ends_at: '2026-10-25T20:00:00.000Z', now: NOW })).toBe('upcoming');
    expect(group_client_booking({ status: 'booked', session_starts_at: '2026-10-25T17:00:00.000Z', session_ends_at: FUTURE_END, now: NOW })).toBe('in_progress');
    expect(group_client_booking({ status: 'booked', session_starts_at: '2026-10-25T16:00:00.000Z', session_ends_at: ENDED, now: NOW })).toBe('finished');
    expect(group_client_booking({ status: 'finished', session_starts_at: '2026-10-25T16:00:00.000Z', session_ends_at: ENDED, now: NOW })).toBe('finished');
    expect(group_client_booking({ status: 'attended', session_starts_at: '2026-10-25T16:00:00.000Z', session_ends_at: ENDED, now: NOW })).toBe('finished');
    expect(group_client_booking({ status: 'cancelled', session_starts_at: ENDED, session_ends_at: ENDED, now: NOW })).toBe('cancelled');
    expect(group_client_booking({ status: 'no_show', session_starts_at: ENDED, session_ends_at: ENDED, now: NOW })).toBe('no_show');
    expect(group_client_booking({ status: 'not_attended', session_starts_at: ENDED, session_ends_at: ENDED, now: NOW })).toBe('not_attended');
    expect(group_client_booking({ status: 'waitlisted', session_starts_at: FUTURE_END, session_ends_at: '2026-10-25T20:00:00.000Z', now: NOW })).toBe('upcoming');
  });
});
