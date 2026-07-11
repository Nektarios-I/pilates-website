# Recurring prebook functions + cron — Phase 2d

**Actor:** cursor  
**Category:** implementation  
**Date:** 2026-07-09

## Summary

Migrations 22–23: recurring CRUD, forecast/health, materialization engine, retry, pg_cron job. SQL + vitest contract tests.

## Files

- `supabase/22_recurring_prebook_functions.sql`
- `supabase/23_recurring_prebook_cron.sql`
- `supabase/tests/recurring_prebook_regression.sql`
- `src/features/bookings/booking-rpc-contract.ts` (recurring helpers)
- `src/features/bookings/booking-rpc-contract.test.ts`
- `supabase/06_drop_all.sql`, `supabase/README.md`

## Rollout

1. Apply `22` on dev/staging
2. Run `supabase/tests/recurring_prebook_regression.sql`
3. Apply `23` only after manual verification

## Next

Staff Client Booking Manager UI (`/staff/client-bookings`).
