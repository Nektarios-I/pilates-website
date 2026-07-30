# Recurring materialize failure visibility

**Date:** 2026-07-30  
**Actor:** cursor  
**Category:** implementation  
**Scope:** Durable cron failures, staff-cancel skip, package-expiry warnings, client Planned slots

## Summary

Migration `40_recurring_materialize_failure_visibility.sql` applied to production. Cron no longer aborts on per-occurrence credit failures. Staff cancel of recurring bookings permanently skips that occurrence. Forecast/client UI warn when packages expire before class. Account page shows Planned slots via `get_my_recurring_planned_slots`.

## Verification

- Unit: planned-recurring-slots + format + account-content — passed  
- DB functions verified present on prod

## Next

Smoke Account Planned slots and staff forecast after deploy.
