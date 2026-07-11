# Materialize selection atomic (migration 31)

**Date:** 2026-07-11  
**Task:** Fix recurring materialization end-to-end with explicit selection, token preflight, booking_ids.

## Problem

Materialize dialog closed without creating bookings. RPC counted stale `succeeded` logs as success. Token checks differed between forecast and materialize. No `booking_ids` in response. Account page not revalidated.

## Solution

### SQL (`supabase/31_materialize_selection_atomic.sql`)

- `private.recurring_log_has_active_booking` helper
- `private.materialize_recurring_occurrence` — raises on failure (transaction rollback), aligned horizon
- `list_client_materializable_occurrences` — adds `token_health`, volatile chronological simulation
- `staff_materialize_client_recurring_selection` — explicit selection, all-or-nothing token preflight (P0037), atomic booking creation, returns `booking_ids`
- Legacy `staff_materialize_recurring_prebooks_for_client` delegates to selection RPC

### App

- `materialize_client_recurring_prebooks` calls selection RPC with **selected** occurrences; success only when `booking_ids.length > 0`
- Dialog shows token badges; blocks submit when any selected row has insufficient tokens
- Recurring tab bumps `forecast_revision` after success; silent dashboard refresh
- Revalidate `/account` and `/account/bookings`

## Apply

Run after migration 30:

```sql
-- supabase/31_materialize_selection_atomic.sql
```

## Verification

- [x] `npm run lint`
- [x] `npm run test`
- [ ] Manual: see `supabase/tests/materialize_selection_regression.sql`
