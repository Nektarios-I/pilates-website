import { add_days, parse_date_key, start_of_week_monday, studio_date_key } from '@/lib/schedule/studio-hours';
import { build_session_availability } from '@/features/bookings/session-availability';

import type { PackageItem } from './booking-types';
import type { SlotSession } from './schedule-actions';

export const PUBLIC_BOOKING_HORIZON_DAYS = 14;

export type SlotCreditRequirements = {
  reformer_credits_required: number;
  mat_credits_required: number;
};

export function is_slot_in_past(date_key: string, slot_start: string, now = Date.now()): boolean {
  const [year, month, day] = date_key.split('-').map(Number);
  const [hours, minutes] = slot_start.split(':').map(Number);
  const slot_time = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return slot_time.getTime() <= now;
}

export function is_slot_full(slot_state: SlotSession | undefined): boolean {
  if (!slot_state) return false;
  return build_session_availability(slot_state.capacity, slot_state.confirmed_count).is_full;
}

export function is_within_public_booking_horizon(date_key: string, now = new Date()): boolean {
  const today_key = studio_date_key(now);
  const today = parse_date_key(today_key);
  const end = add_days(today, PUBLIC_BOOKING_HORIZON_DAYS);
  const target = parse_date_key(date_key);
  return target >= today && target <= end;
}

export function slot_is_selectable(
  is_past: boolean,
  is_full: boolean,
  is_open_for_public = true,
): boolean {
  return !is_past && !is_full && is_open_for_public;
}

export function booking_action_label(is_pending: boolean): string {
  return is_pending ? 'Booking…' : 'Confirm booking';
}

export function success_banner_title(): string {
  return 'Booking confirmed';
}

export function package_label(pkg: PackageItem): string {
  if (pkg.package_type === 'unlimited' || pkg.package_type === 'monthly') {
    return `${pkg.package_name} — unlimited`;
  }
  const credits = pkg.credits_remaining ?? 0;
  return `${pkg.package_name} — ${credits} credit${credits !== 1 ? 's' : ''}`;
}

export function eligible_reformer_packages(
  packages: PackageItem[],
  requirements: SlotCreditRequirements,
): PackageItem[] {
  return packages.filter((pkg) => {
    if (pkg.class_type !== 'reformer') return false;
    if (pkg.package_type === 'unlimited' || pkg.package_type === 'monthly') return true;
    return (pkg.credits_remaining ?? 0) >= requirements.reformer_credits_required;
  });
}

export function eligible_mat_packages(
  packages: PackageItem[],
  requirements: SlotCreditRequirements,
): PackageItem[] {
  return packages.filter((pkg) => {
    if (pkg.class_type !== 'mat') return false;
    if (pkg.package_type === 'unlimited' || pkg.package_type === 'monthly') return true;
    return (pkg.credits_remaining ?? 0) >= requirements.mat_credits_required;
  });
}

export function can_pay_required_credits(
  packages: PackageItem[],
  requirements: SlotCreditRequirements,
): boolean {
  const requires_reformer = requirements.reformer_credits_required > 0;
  const requires_mat = requirements.mat_credits_required > 0;

  return (
    (!requires_reformer ||
      eligible_reformer_packages(packages, requirements).length > 0) &&
    (!requires_mat || eligible_mat_packages(packages, requirements).length > 0)
  );
}

/** Rolling pill strip: 14 upcoming days from the anchor week's Monday. */
export function build_date_pill_range(anchor: Date, day_count = 14): Date[] {
  const monday = start_of_week_monday(anchor);
  return Array.from({ length: day_count }, (_, index) => add_days(monday, index));
}
