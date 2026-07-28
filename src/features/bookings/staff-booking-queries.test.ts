import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  BOOKINGS_CLIENT_PROFILE_EMBED,
  STAFF_BOOKING_HISTORY_SELECT,
  STAFF_DAY_BOOKINGS_SELECT,
  has_ambiguous_booking_profiles_embed,
  log_staff_booking_query_error,
  studio_day_window_bounds,
  uses_explicit_booking_client_profile_embed,
} from './staff-booking-queries';

describe('staff booking query contract (post-migration 18)', () => {
  it('requires explicit bookings_user_id_fkey for the booked client embed', () => {
    expect(BOOKINGS_CLIENT_PROFILE_EMBED).toContain('profiles!bookings_user_id_fkey!inner');
    expect(BOOKINGS_CLIENT_PROFILE_EMBED).not.toMatch(/^profiles!inner/);
  });

  it('history and day selects use the explicit client relationship', () => {
    for (const select of [STAFF_BOOKING_HISTORY_SELECT, STAFF_DAY_BOOKINGS_SELECT]) {
      expect(uses_explicit_booking_client_profile_embed(select)).toBe(true);
      expect(has_ambiguous_booking_profiles_embed(select)).toBe(false);
    }
  });

  it('day select keeps the disambiguated instructor embed', () => {
    expect(STAFF_DAY_BOOKINGS_SELECT).toContain('profiles!sessions_instructor_id_fkey');
  });

  it('rejects the legacy ambiguous profiles!inner pattern', () => {
    expect(has_ambiguous_booking_profiles_embed('profiles!inner (full_name)')).toBe(true);
    expect(
      has_ambiguous_booking_profiles_embed(`
        profiles!inner (full_name),
        sessions!inner (instructor:profiles!sessions_instructor_id_fkey (full_name))
      `),
    ).toBe(true);
  });

  it('accepts explicit client and creator embeds', () => {
    expect(
      has_ambiguous_booking_profiles_embed(
        'profiles!bookings_user_id_fkey!inner (full_name)',
      ),
    ).toBe(false);
    expect(
      has_ambiguous_booking_profiles_embed(
        'profiles!bookings_created_by_user_id_fkey (full_name)',
      ),
    ).toBe(false);
  });
});

describe('staff booking action sources must not use ambiguous embeds', () => {
  const files = [
    'src/app/(marketing)/staff/bookings/actions.ts',
    'src/app/(marketing)/staff/day-bookings/actions.ts',
  ];

  it.each(files)('%s uses shared explicit client embed (no bare profiles!inner)', (relative) => {
    const source = readFileSync(resolve(process.cwd(), relative), 'utf8');

    expect(source).toMatch(/STAFF_(BOOKING_HISTORY|DAY_BOOKINGS)_SELECT/);
    expect(source).not.toMatch(/profiles!inner\s*\(/);
    expect(has_ambiguous_booking_profiles_embed(source)).toBe(false);
  });
});

describe('studio_day_window_bounds', () => {
  it('documents naive calendar-day strings used by staff day filters', () => {
    expect(studio_day_window_bounds('2026-07-30')).toEqual({
      day_start: '2026-07-30T00:00:00',
      day_end: '2026-07-30T23:59:59',
    });
  });

  it('keeps early-studio-morning sessions outside a previous UTC calendar day string', () => {
    // 30 Jul 06:00 Europe/Nicosia (UTC+3 summer) = 2026-07-30T03:00:00.000Z
    // Naive day window for 2026-07-30 still includes that ISO instant when Postgres
    // interprets bounds in UTC — documented current behavior, not a rewrite.
    const { day_start, day_end } = studio_day_window_bounds('2026-07-30');
    const start_ms = Date.parse(`${day_start}Z`);
    const end_ms = Date.parse(`${day_end}Z`);
    const early_nicosia = Date.parse('2026-07-30T03:00:00.000Z');

    expect(early_nicosia).toBeGreaterThanOrEqual(start_ms);
    expect(early_nicosia).toBeLessThanOrEqual(end_ms);
  });
});

describe('log_staff_booking_query_error', () => {
  it('logs PostgREST code and message for server diagnostics', () => {
    const error = vi.fn();
    log_staff_booking_query_error(
      'list_day_bookings',
      {
        code: 'PGRST201',
        message: 'Could not embed because more than one relationship was found',
        hint: 'Try profiles!bookings_user_id_fkey',
      },
      { error },
    );

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('[list_day_bookings] query failed:'),
    );
    expect(error.mock.calls[0]?.[0]).toContain('code=PGRST201');
    expect(error.mock.calls[0]?.[0]).toContain('message=Could not embed');
    expect(error.mock.calls[0]?.[0]).toContain('hint=Try profiles!bookings_user_id_fkey');
  });
});
