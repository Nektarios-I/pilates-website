import { describe, expect, it } from 'vitest';

import {
  can_use_package_for_booking,
  format_expires_in_days,
  get_effective_package_status,
  get_package_status_label,
  is_package_expiring_soon,
  is_package_past_expiry,
  next_stored_status_after_credit_adjust,
  next_stored_status_after_expiry_extend,
  partition_packages_by_lifecycle,
  type PackageLifecycleFields,
} from './lifecycle';

const NOW = new Date('2026-07-30T12:00:00.000Z');

function pkg(overrides: Partial<PackageLifecycleFields> = {}): PackageLifecycleFields {
  return {
    status: 'active',
    credits_remaining: 5,
    expires_at: '2026-08-30T12:00:00.000Z',
    ...overrides,
  };
}

describe('get_effective_package_status', () => {
  it('returns active for valid credits and future expiry', () => {
    expect(get_effective_package_status(pkg(), NOW)).toBe('active');
  });

  it('returns expiring_soon within 7 days and remains bookable', () => {
    const row = pkg({ expires_at: '2026-08-04T12:00:00.000Z' });
    expect(get_effective_package_status(row, NOW)).toBe('expiring_soon');
    expect(is_package_expiring_soon(row, NOW)).toBe(true);
    expect(can_use_package_for_booking(row, 1, NOW)).toBe(true);
    expect(get_package_status_label('expiring_soon')).toBe('Expiring soon');
  });

  it('returns expired when expires_at <= now even with leftover credits', () => {
    const row = pkg({
      status: 'active',
      credits_remaining: 14,
      expires_at: '2026-07-20T08:20:59.000Z',
    });
    expect(get_effective_package_status(row, NOW)).toBe('expired');
    expect(can_use_package_for_booking(row, 1, NOW)).toBe(false);
  });

  it('treats exact expires_at === now as expired', () => {
    const row = pkg({ expires_at: NOW.toISOString(), status: 'active', credits_remaining: 3 });
    expect(is_package_past_expiry(row.expires_at, NOW)).toBe(true);
    expect(get_effective_package_status(row, NOW)).toBe('expired');
    expect(can_use_package_for_booking(row, 1, NOW)).toBe(false);
  });

  it('treats stored status expired as expired even with null expires_at', () => {
    const row = pkg({ status: 'expired', expires_at: null, credits_remaining: 2 });
    expect(get_effective_package_status(row, NOW)).toBe('expired');
    expect(can_use_package_for_booking(row, 1, NOW)).toBe(false);
  });

  it('returns exhausted for zero credits', () => {
    const row = pkg({ credits_remaining: 0, status: 'active' });
    expect(get_effective_package_status(row, NOW)).toBe('exhausted');
    expect(can_use_package_for_booking(row, 1, NOW)).toBe(false);
  });

  it('returns exhausted for stored used_up', () => {
    const row = pkg({ status: 'used_up', credits_remaining: 0 });
    expect(get_effective_package_status(row, NOW)).toBe('exhausted');
  });

  it('returns cancelled with highest priority', () => {
    const row = pkg({
      status: 'cancelled',
      credits_remaining: 7,
      expires_at: '2026-08-21T16:00:00.000Z',
    });
    expect(get_effective_package_status(row, NOW)).toBe('cancelled');
    expect(can_use_package_for_booking(row, 1, NOW)).toBe(false);
  });

  it('prefers expired over exhausted when both apply', () => {
    const row = pkg({
      status: 'used_up',
      credits_remaining: 0,
      expires_at: '2026-07-01T00:00:00.000Z',
    });
    expect(get_effective_package_status(row, NOW)).toBe('expired');
  });

  it('treats null credits as unlimited when otherwise active', () => {
    const row = pkg({ credits_remaining: null });
    expect(get_effective_package_status(row, NOW)).toBe('active');
    expect(can_use_package_for_booking(row, 99, NOW)).toBe(true);
  });

  it('treats null expiry as non-expiring', () => {
    const row = pkg({ expires_at: null });
    expect(get_effective_package_status(row, NOW)).toBe('active');
  });
});

describe('can_use_package_for_booking credit requirements', () => {
  it('requires enough credits for the booking', () => {
    const row = pkg({ credits_remaining: 1 });
    expect(can_use_package_for_booking(row, 1, NOW)).toBe(true);
    expect(can_use_package_for_booking(row, 2, NOW)).toBe(false);
  });
});

describe('partition_packages_by_lifecycle', () => {
  it('puts expiring_soon into the active group and separates history groups', () => {
    const rows = [
      pkg({ status: 'active', expires_at: '2026-09-01T00:00:00.000Z', credits_remaining: 4 }),
      pkg({ status: 'active', expires_at: '2026-08-02T00:00:00.000Z', credits_remaining: 2 }),
      pkg({ status: 'active', expires_at: '2026-07-01T00:00:00.000Z', credits_remaining: 9 }),
      pkg({ status: 'used_up', expires_at: '2026-08-20T00:00:00.000Z', credits_remaining: 0 }),
      pkg({ status: 'cancelled', expires_at: '2026-08-20T00:00:00.000Z', credits_remaining: 3 }),
    ];

    const groups = partition_packages_by_lifecycle(rows, NOW);
    expect(groups.active).toHaveLength(2);
    expect(groups.expired).toHaveLength(1);
    expect(groups.exhausted).toHaveLength(1);
    expect(groups.cancelled).toHaveLength(1);
  });
});

describe('next_stored_status_after_credit_adjust', () => {
  it('keeps expired packages expired after credit adjustment', () => {
    const row = pkg({
      status: 'expired',
      credits_remaining: 1,
      expires_at: '2026-07-20T00:00:00.000Z',
    });
    expect(next_stored_status_after_credit_adjust(row, 10, NOW)).toBe('expired');
  });

  it('keeps cron-lagged past-expiry packages expired when credits rise', () => {
    const row = pkg({
      status: 'active',
      credits_remaining: 0,
      expires_at: '2026-07-29T00:00:00.000Z',
    });
    expect(next_stored_status_after_credit_adjust(row, 5, NOW)).toBe('expired');
  });

  it('reactivates exhausted but not-expired packages when credits are restored', () => {
    const row = pkg({
      status: 'used_up',
      credits_remaining: 0,
      expires_at: '2026-08-20T00:00:00.000Z',
    });
    expect(next_stored_status_after_credit_adjust(row, 3, NOW)).toBe('active');
  });

  it('marks used_up when credits drop to zero on a valid package', () => {
    const row = pkg({ status: 'active', credits_remaining: 2 });
    expect(next_stored_status_after_credit_adjust(row, 0, NOW)).toBe('used_up');
  });

  it('preserves cancelled status', () => {
    const row = pkg({ status: 'cancelled', credits_remaining: 0 });
    expect(next_stored_status_after_credit_adjust(row, 5, NOW)).toBe('cancelled');
  });
});

describe('next_stored_status_after_expiry_extend', () => {
  it('reactivates when new expiry is future and credits remain', () => {
    expect(
      next_stored_status_after_expiry_extend(4, '2026-09-01T00:00:00.000Z', NOW),
    ).toBe('active');
  });

  it('stays exhausted when extending an expired pack with zero credits', () => {
    expect(
      next_stored_status_after_expiry_extend(0, '2026-09-01T00:00:00.000Z', NOW),
    ).toBe('used_up');
  });
});

describe('format_expires_in_days', () => {
  it('formats restrained copy for account/staff UI', () => {
    expect(format_expires_in_days('2026-08-04T12:00:00.000Z', NOW)).toBe('Expires in 5 days');
    expect(format_expires_in_days(NOW.toISOString(), NOW)).toBe('Expires today');
  });
});
