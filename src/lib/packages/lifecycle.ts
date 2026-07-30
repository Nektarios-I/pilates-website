/**
 * Shared package lifecycle helpers.
 *
 * Effective status is derived from stored fields and must not trust
 * `status === 'active'` alone (cron may lag behind `expires_at`).
 */

export const PACKAGE_EXPIRING_SOON_DAYS = 7;

export type StoredPackageStatus = 'active' | 'expired' | 'used_up' | 'cancelled' | string;

export type EffectivePackageStatus =
  | 'cancelled'
  | 'expired'
  | 'exhausted'
  | 'expiring_soon'
  | 'active';

export type PackageLifecycleFields = {
  status: StoredPackageStatus;
  credits_remaining: number | null;
  expires_at: string | Date | null;
};

export type LifecyclePartition<T> = {
  active: T[];
  expired: T[];
  exhausted: T[];
  cancelled: T[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function to_date(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** True when expires_at is in the past or exactly now. */
export function is_package_past_expiry(
  expires_at: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  const expiry = to_date(expires_at ?? null);
  if (!expiry) return false;
  return expiry.getTime() <= now.getTime();
}

export function days_until_expiry(
  expires_at: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  const expiry = to_date(expires_at ?? null);
  if (!expiry) return null;
  return Math.ceil((expiry.getTime() - now.getTime()) / MS_PER_DAY);
}

/**
 * Priority: cancelled → expired → exhausted → expiring_soon → active.
 */
export function get_effective_package_status(
  pkg: PackageLifecycleFields,
  now: Date = new Date(),
): EffectivePackageStatus {
  if (pkg.status === 'cancelled') {
    return 'cancelled';
  }

  const past_expiry = is_package_past_expiry(pkg.expires_at, now);
  if (past_expiry || pkg.status === 'expired') {
    return 'expired';
  }

  if (
    (pkg.credits_remaining !== null && pkg.credits_remaining <= 0) ||
    pkg.status === 'used_up'
  ) {
    return 'exhausted';
  }

  const days = days_until_expiry(pkg.expires_at, now);
  if (days !== null && days >= 0 && days <= PACKAGE_EXPIRING_SOON_DAYS) {
    return 'expiring_soon';
  }

  return 'active';
}

export function is_package_expiring_soon(
  pkg: PackageLifecycleFields,
  now: Date = new Date(),
): boolean {
  return get_effective_package_status(pkg, now) === 'expiring_soon';
}

/**
 * Bookable when effectively active or expiring soon, and credits cover the requirement.
 * Null credits_remaining means unlimited.
 */
export function can_use_package_for_booking(
  pkg: PackageLifecycleFields,
  required_credits = 1,
  now: Date = new Date(),
): boolean {
  const effective = get_effective_package_status(pkg, now);
  if (effective !== 'active' && effective !== 'expiring_soon') {
    return false;
  }

  if (pkg.credits_remaining === null) {
    return true;
  }

  return pkg.credits_remaining >= required_credits;
}

export function get_package_status_label(status: EffectivePackageStatus): string {
  switch (status) {
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    case 'exhausted':
      return 'Exhausted';
    case 'expiring_soon':
      return 'Expiring soon';
    case 'active':
      return 'Active';
  }
}

export function format_expires_in_days(
  expires_at: string | Date | null | undefined,
  now: Date = new Date(),
): string | null {
  const days = days_until_expiry(expires_at, now);
  if (days === null || days < 0) return null;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires in 1 day';
  return `Expires in ${days} days`;
}

/**
 * Partition into staff Membership UI groups.
 * Active bucket includes both `active` and `expiring_soon`.
 */
export function partition_packages_by_lifecycle<T extends PackageLifecycleFields>(
  packages: readonly T[],
  now: Date = new Date(),
): LifecyclePartition<T> {
  const partition: LifecyclePartition<T> = {
    active: [],
    expired: [],
    exhausted: [],
    cancelled: [],
  };

  for (const pkg of packages) {
    const effective = get_effective_package_status(pkg, now);
    switch (effective) {
      case 'cancelled':
        partition.cancelled.push(pkg);
        break;
      case 'expired':
        partition.expired.push(pkg);
        break;
      case 'exhausted':
        partition.exhausted.push(pkg);
        break;
      case 'expiring_soon':
      case 'active':
        partition.active.push(pkg);
        break;
    }
  }

  return partition;
}

/**
 * Next stored `user_packages.status` after a credit adjustment.
 * Never reactivates an expired package via credits alone.
 */
export function next_stored_status_after_credit_adjust(
  pkg: PackageLifecycleFields,
  next_credits: number | null,
  now: Date = new Date(),
): StoredPackageStatus {
  if (pkg.status === 'cancelled') {
    return 'cancelled';
  }

  if (is_package_past_expiry(pkg.expires_at, now) || pkg.status === 'expired') {
    return 'expired';
  }

  if (next_credits !== null && next_credits <= 0) {
    return 'used_up';
  }

  return 'active';
}

/**
 * Next stored status after an explicit expiry extension / reactivate.
 * Expired packs with zero credits become used_up, not active.
 */
export function next_stored_status_after_expiry_extend(
  credits_remaining: number | null,
  new_expires_at: string | Date | null,
  now: Date = new Date(),
): StoredPackageStatus {
  if (is_package_past_expiry(new_expires_at, now)) {
    return 'expired';
  }

  if (credits_remaining !== null && credits_remaining <= 0) {
    return 'used_up';
  }

  return 'active';
}
