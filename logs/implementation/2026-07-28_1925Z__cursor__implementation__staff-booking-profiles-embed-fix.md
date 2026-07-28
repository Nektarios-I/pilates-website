# Staff booking PGRST201 regression fix

**Date:** 2026-07-28  
**Actor:** cursor  
**Category:** implementation  
**Scope:** `/staff/bookings`, `/staff/day-bookings` ambiguous `bookings → profiles` embed

## Summary

Fixed PostgREST PGRST201 after migration 18 dual FK to `profiles`. Shared select fragments now use `profiles!bookings_user_id_fkey!inner`. Regression tests added first (contract + action mocks + e2e). Server logging now includes `code`/`hint`.

## Verification status

**PASS** — lint, typecheck, 229 unit tests, build, staff e2e (Maria 30 Jul), chromium smoke.

## Files

- `src/features/bookings/staff-booking-queries.ts` (+ tests)
- `src/app/(marketing)/staff/bookings/actions.ts` (+ tests)
- `src/app/(marketing)/staff/day-bookings/actions.ts` (+ tests)
- e2e staff bookings project + fixtures

## Next recommended action

Deploy to production, then smoke Day Bookings / Booking History for Maria on 30 Jul.
