import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function load_env_file(relative_path: string) {
  const absolute_path = resolve(process.cwd(), relative_path);
  if (!existsSync(absolute_path)) return;

  for (const line of readFileSync(absolute_path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

load_env_file('.env.local');
load_env_file('.env');

export function booking_e2e_configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.E2E_CLIENT_EMAIL &&
      process.env.E2E_CLIENT_PASSWORD,
  );
}

export function near_cutoff_booking_configured(): boolean {
  return Boolean(
    booking_e2e_configured() &&
      process.env.E2E_NEAR_CUTOFF_BOOKING_ID &&
      process.env.E2E_NEAR_CUTOFF_BOOKING_TITLE,
  );
}

export function staff_booking_e2e_configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.E2E_STAFF_EMAIL &&
      process.env.E2E_STAFF_PASSWORD,
  );
}

export const e2e_client_email = () => process.env.E2E_CLIENT_EMAIL ?? '';
export const e2e_client_password = () => process.env.E2E_CLIENT_PASSWORD ?? '';
export const e2e_staff_email = () => process.env.E2E_STAFF_EMAIL ?? '';
export const e2e_staff_password = () => process.env.E2E_STAFF_PASSWORD ?? '';
export const e2e_near_cutoff_booking_id = () => process.env.E2E_NEAR_CUTOFF_BOOKING_ID ?? '';
export const e2e_near_cutoff_booking_title = () =>
  process.env.E2E_NEAR_CUTOFF_BOOKING_TITLE ?? '';
/** Optional known client display name for staff booking regression (e.g. MARIA ERAKLEOUS). */
export const e2e_staff_known_client_name = () =>
  process.env.E2E_STAFF_KNOWN_CLIENT_NAME ?? 'MARIA ERAKLEOUS';
/** Optional YYYY-MM-DD for day bookings regression (defaults to 2026-07-30). */
export const e2e_staff_known_booking_date = () =>
  process.env.E2E_STAFF_KNOWN_BOOKING_DATE ?? '2026-07-30';
