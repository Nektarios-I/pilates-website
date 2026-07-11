# Materialize now dialog + migration 27 fix

**Date:** 2026-07-10  
**Actor:** cursor  

## Summary

- Fixed migration 27 `allocate_forecast_tokens` INOUT SQL error → `try_allocate_forecast_tokens` returns table.
- Added migration 28: client-scoped materialization with one-run exclusions.
- Recurring tab: **Run materialization now** opens dialog to exclude occurrences before booking.
- Verified rolling 14-day window: cron + `generate_series(studio_today, studio_today+14)` already rolls forward daily.

## SQL to run

1. `27_booking_horizon_recurring_priority_forecast.sql` — includes `DROP FUNCTION get_recurring_prebook_forecast(uuid)` before new signature
2. `28_staff_client_materialization.sql`

If 27 failed partway through, re-run the **entire** 27 file (idempotent).

## Verification

- typecheck + test — pass
