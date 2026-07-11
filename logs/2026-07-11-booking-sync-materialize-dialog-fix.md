# Booking sync + materialize dialog fix

**Date:** 2026-07-11  
**Task:** Fix recurring/staff/public booking consistency on cancel; fix “Run materialization now” UX.

## Problem

1. Cancelling a recurring-sourced booking in staff Bookings tab left the Recurring forecast showing **Booked** (materialization log still `succeeded`).
2. “Run materialization now” appeared to do nothing — modal likely clipped behind layout / RPC errors swallowed as empty list.

## Changes

### SQL (`supabase/30_cancel_booking_recurring_sync.sql`)

- `cancel_booking`: deletes linked `recurring_prebook_materialization_log` row on cancel.
- `get_recurring_prebook_forecast`: `booked` only when log succeeded **and** booking still active.
- `list_client_materializable_occurrences`: same active-booking check; join on `occurrence_starts_at`.
- `recurring_blocks_public_booking`: gate uses active booking, not stale succeeded logs.
- `materialize_recurring_occurrence` + `staff_materialize_recurring_prebooks_for_client`: retry when succeeded log has no live booking.

### App

- `MaterializeClientDialog`: portal to `document.body`, `z-[100]`, backdrop/Escape close, surface RPC load errors.
- `list_client_materializable_occurrences` action returns `{ success, rows | error }`.

## Apply order

Run after migration 29:

```sql
-- supabase/30_cancel_booking_recurring_sync.sql
```

## Verification

- [x] `npm run lint`
- [x] `npm run test` (193 passed)
- [ ] Manual: cancel recurring booking → Recurring tab shows Planned
- [ ] Manual: Run materialization now → modal closes, message visible, bookings refresh

## Follow-up (2026-07-11)

Materialize dialog UX fix: RPC was running but UI stayed frozen when action returned `success: false` (errors hidden behind modal). Dialog now closes on success/failure, shows errors on Recurring tab, silent dashboard refresh after success.
