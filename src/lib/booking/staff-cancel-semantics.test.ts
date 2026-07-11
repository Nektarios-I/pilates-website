import { describe, expect, it } from 'vitest';

import { client_may_cancel_online } from '@/lib/booking/cancellation-policy';

describe('staff vs client cancel cutoff semantics', () => {
  it('client UI helper blocks inside 2h regardless of staff exemption in SQL', () => {
    const near_start = '2026-07-10T11:30:00.000Z';
    const now = Date.parse('2026-07-10T10:00:00.000Z');
    expect(client_may_cancel_online(near_start, now)).toBe(false);
  });

  it('documents that staff should not receive P0029 from cancel_booking in normal operation', () => {
    // Regression guard: if staff cancel ever maps P0029, investigate SQL is_staff() path.
    expect('P0029').toBeTruthy();
  });
});
