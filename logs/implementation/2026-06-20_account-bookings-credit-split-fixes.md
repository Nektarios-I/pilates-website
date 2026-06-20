# Account bookings and session-card credit split fixes

**Date:** 2026-06-20  
**Task:** Remove account notes, fix custom session-card package payment, and add a detailed bookings page.

## Changes

- Removed the blue “future functionality” note boxes from the account profile/packages sections.
- Added explicit `reformer_credits_required` and `mat_credits_required` fields to session cards and generated sessions.
- Added `booking_credit_charges` so bookings can record exact reformer/mat package deductions and cancellations can refund the correct packages.
- Updated booking UI to show separate package selectors only for required reformer/mat credits.
- Fixed account upcoming bookings by filtering joined booking/session rows server-side.
- Added `/account/bookings` with upcoming and history sections, booking status, session date/time, location, and credit summary.
- Updated reset/teardown/RLS helper scripts and SQL README instructions.

## Verification

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed (43 tests).
- `npm run build` passed.

## SQL follow-up

For an existing database, run:

1. `01_schema.sql`
2. `02_rls.sql`
3. `03_functions.sql`
4. `04_seed.sql`
5. `12_studio_schedule.sql`

No reset is required unless a clean dev database is desired.
