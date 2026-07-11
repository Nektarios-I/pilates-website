import { describe, expect, it } from 'vitest';

import {
  CANCELLATION_POLICY_SHORT,
  client_cancel_blocked_by_cutoff,
  client_may_cancel_online,
  session_is_full_for_public_booking,
} from '@/lib/booking/cancellation-policy';

describe('cancellation-policy', () => {
  it('allows cancel when session is more than 2 hours away', () => {
    const starts = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    expect(client_may_cancel_online(starts)).toBe(true);
  });

  it('blocks cancel when session is within 2 hours', () => {
    const starts = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(client_may_cancel_online(starts)).toBe(false);
  });

  it('blocks cancel at exactly 2 hours (must be more than 2 hours)', () => {
    const now = Date.parse('2026-07-10T10:00:00.000Z');
    const starts = '2026-07-10T12:00:00.000Z';
    expect(client_may_cancel_online(starts, now)).toBe(false);
    expect(client_cancel_blocked_by_cutoff(starts, now)).toBe(true);
  });

  it('allows cancel just after the 2-hour boundary', () => {
    const now = Date.parse('2026-07-10T10:00:00.000Z');
    const starts = '2026-07-10T12:00:00.001Z';
    expect(client_may_cancel_online(starts, now)).toBe(true);
  });

  it('detects full sessions for public booking', () => {
    expect(session_is_full_for_public_booking(6, 6)).toBe(true);
    expect(session_is_full_for_public_booking(5, 6)).toBe(false);
  });

  it('exposes concise policy copy', () => {
    expect(CANCELLATION_POLICY_SHORT).toMatch(/2 hours/i);
  });
});
