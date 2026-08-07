import {
  is_within_public_booking_horizon,
  PUBLIC_BOOKING_HORIZON_DAYS,
} from '@/app/(marketing)/book/booking-ui';
import { parse_date_key, studio_date_key } from '@/lib/schedule/studio-hours';

/** Staff/instructor manual booking: today and any future studio date (no upper horizon). */
export function is_within_staff_manual_booking_window(
  date_key: string,
  now = new Date(),
): boolean {
  const today_key = studio_date_key(now);
  const today = parse_date_key(today_key);
  const target = parse_date_key(date_key);
  return target >= today;
}

/** Public/client self-booking keeps the existing rolling horizon. */
export function is_within_public_self_booking_window(
  date_key: string,
  now = new Date(),
): boolean {
  return is_within_public_booking_horizon(date_key, now);
}

export function staff_manual_booking_blocks_past_dates(
  date_key: string,
  now = new Date(),
): boolean {
  return !is_within_staff_manual_booking_window(date_key, now);
}

export function public_self_booking_horizon_days(): number {
  return PUBLIC_BOOKING_HORIZON_DAYS;
}
