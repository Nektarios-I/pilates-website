# Booking core refactor + staff RPCs — Phase 2b/2c

**Actor:** cursor  
**Category:** implementation  
**Date:** 2026-07-08

## Summary

Migrations 19–21: `private.book_session_core`, public wrapper refactor, staff booking RPCs, staff cancel/package parity, provenance write-through. Vitest contract tests + SQL regression script.

## Files

- `supabase/19_booking_core_refactor.sql`
- `supabase/20_staff_booking_rpc.sql`
- `supabase/21_cancel_booking_staff_auth.sql`
- `supabase/tests/booking_core_regression.sql`
- `src/features/bookings/booking-rpc-contract.ts`
- `src/features/bookings/booking-rpc-contract.test.ts`
- `supabase/06_drop_all.sql`, `supabase/README.md`

## Not in scope

Materialization, cron, UI, 2-hour cancellation policy, public horizon enablement.

## Verification

- [x] `npm run test -- src/features/bookings/booking-rpc-contract.test.ts`
- [ ] Apply 19–21 on dev Supabase
- [ ] Run `supabase/tests/booking_core_regression.sql` sanity block

## Next

Phase 2d: `22_recurring_prebook_functions.sql` (CRUD + materialization).
