import { describe, expect, it } from 'vitest';

import { add_calendar_months } from '@/lib/schedule/calendar-months';

describe('add_calendar_months', () => {
  it('adds three calendar months to the same day', () => {
    expect(add_calendar_months('2026-08-24', 3)).toBe('2026-11-24');
  });

  it('crosses year boundaries', () => {
    expect(add_calendar_months('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('clamps overflow days in shorter months', () => {
    expect(add_calendar_months('2026-01-31', 1)).toBe('2026-02-28');
  });
});
