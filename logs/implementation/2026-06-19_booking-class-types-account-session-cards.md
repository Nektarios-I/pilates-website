# Booking class types, account balances, and session cards

**Date:** 2026-06-19  
**Task:** Separate reformer and mat credits/pricing, refresh client account package/booking data, and add booking session cards managed by owners/admins.

## Changes

- Added `packages.class_type` and `session_cards` SQL support, with RLS, seed/reset/drop coverage, and booking validation that prevents using reformer credits for mat sessions or vice versa.
- Added mat package pricing alongside reformer pricing and made the pricing page visually separate the two class types.
- Updated account package/bookings queries and UI to show live active packages, upcoming bookings, class type, and remaining credits.
- Reworked booking to start with a class card, then show date/time slots for the selected class; unavailable slots remain visible by default and can be filtered out.
- Added `/staff/session-cards` for owners/admins to add, update, deactivate, or remove booking class cards.
- Added direct `Logout` to the header account menu and removed the example client name from the login placeholder.

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

No data reset is required unless a clean dev database is desired.
