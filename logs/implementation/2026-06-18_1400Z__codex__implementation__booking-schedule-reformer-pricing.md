# Log Entry

- Date: 2026-06-18
- Actor: codex
- Category: implementation
- Topic: booking-schedule-reformer-pricing
- Status: completed

## Purpose

Implement reformer pricing catalog, calendar booking flow, per-day studio schedule for owners/admins, name-based sign-in, and studio content updates (Instagram, map).

## Actions Performed

- Added `supabase/12_studio_schedule.sql` (hours table, RPCs, RLS) and `supabase/13_reformer_packages.sql`.
- Rebuilt `/book` with week/month/today calendar and hourly slot booking.
- Added `/staff/schedule` for owner/admin day hours editing.
- Updated pricing/content, login by NAME SURNAME, invite name format, account menu links.

## Verification

- lint, typecheck, build: pass
- focused unit tests: pass

## Next Recommended Action

- Run database scripts on Supabase (see user-facing migration instructions in chat).
