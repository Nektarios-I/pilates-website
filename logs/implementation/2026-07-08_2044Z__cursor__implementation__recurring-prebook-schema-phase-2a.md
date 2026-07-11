# Recurring prebook schema — Phase 2a

**Actor:** cursor  
**Category:** implementation  
**Date:** 2026-07-08

## Summary

Additive migration `18_recurring_prebook_schema.sql`: four recurring-prebook tables, booking provenance columns, staff-only RLS. Updated reset/drop/RLS utility scripts and `supabase/README.md`.

## Files changed

- `supabase/18_recurring_prebook_schema.sql` (new)
- `supabase/05_reset_data.sql`
- `supabase/06_drop_all.sql`
- `supabase/07_disable_rls.sql`
- `supabase/08_enable_rls.sql`
- `supabase/README.md`

## Not in scope

- Booking RPC refactor, materialization, cron, app/UI, cancellation policy (2-hour refund deferred).

## Verification

- [ ] Run `18_recurring_prebook_schema.sql` on dev/staging Supabase
- [ ] Confirm existing bookings backfill `booking_source = 'client'`
- [ ] Confirm `05_reset_data.sql` truncates new tables without FK errors

## Next

Phase 2b: `19_booking_core_refactor.sql` + public booking parity tests.
