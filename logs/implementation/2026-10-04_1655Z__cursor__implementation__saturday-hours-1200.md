# Saturday default hours 07:00–12:00

- date: 2026-10-04 16:55Z
- actor: cursor
- category: implementation
- topic: saturday-hours-1200
- branch: main
- commit: this commit
- related plan: Saturday hours audit (07:00–11:00 to 07:00–12:00)
- related prompt: implement Saturday studio hours change
- status: implemented, tests run, pending owner SQL apply on Supabase

## Purpose

Extend the built-in Saturday studio close from 11:00 to 12:00 so a 60-minute 11:00 class is a valid default slot. Leave weekday hours, Sunday, existing sessions, and recurring lines unchanged.

## Inputs / context used

Audit of `get_default_studio_hours`, `get_default_weekly_ranges`, booking slot RPCs, and live data: no Saturday `studio_day_schedule` rows; existing Saturday sessions start at 07:00, 08:00, or 09:00; one active Saturday recurring line at 08:00.

## Actions performed

- Added `supabase/44_saturday_hours_1200.sql` to replace `get_default_studio_hours` with Saturday end `12:00`.
- Updated the same function and comment in `supabase/12_studio_schedule.sql`.
- Updated `get_default_weekly_ranges` and Saturday hours copy.
- Updated the recurring weekly slot test and added a read-only SQL verification snippet.

## Files changed or inspected

- `supabase/44_saturday_hours_1200.sql`
- `supabase/12_studio_schedule.sql`
- `supabase/tests/verify_saturday_hours_1200.sql`
- `src/lib/schedule/studio-hours.ts`
- `src/config/site_content.ts`
- `src/app/(marketing)/staff/schedule/page.tsx`
- `src/features/client-booking-manager/components/recurring-tab.tsx`
- `src/features/bookings/recurring-weekly-slot-options.test.ts`

Contact page and homepage hours read `site_content.contact_preview.hours.saturday`, so they pick up the new string without their own edits.

## Commands run

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run test` — 366 passed, 1 failed

## Result

Default Saturday range is 07:00–12:00 in SQL source and TypeScript. 60-minute Saturday starts are 07:00, 08:00, 09:00, 10:00, 11:00. Last slot ends at 12:00.

## Verification

`recurring-weekly-slot-options.test.ts` expects the new Saturday starts, last end `12:00`, and accepts Saturday 08:00 and 11:00 while rejecting 12:00. SQL snippet is for the owner to run after applying migration 44. Live database was not updated in this change.

## Blockers / risks

The single test failure is pre-existing: `materializes a slot then books for the client` returns “Staff cannot manually book sessions in the past.” Open-slot RPCs still ignore per-day overrides and use the weekly default. Production hours stay 07:00–11:00 until `44_saturday_hours_1200.sql` is applied in Supabase.

## Next recommended action

Owner runs `supabase/44_saturday_hours_1200.sql` in the Supabase SQL Editor, then `supabase/tests/verify_saturday_hours_1200.sql`.
