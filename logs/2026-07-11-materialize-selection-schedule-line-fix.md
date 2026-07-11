# Materialize recurring — investigation and fix (migration 32)

**Date:** 2026-07-11  
**Status:** Code complete — **apply migration 32 in Supabase before retesting**

## Problem

Staff clicks **Run materialization now**, selects planned rows with credits OK, confirms — popup closes but forecast stays **Planned**, no bookings appear, credits unchanged.

Terminal showed `materialize_client_recurring_prebooks` returning HTTP 200 in ~300ms with **no subsequent `load_client_dashboard`** — consistent with the **failure path** (not success + refresh).

## Root causes identified

1. **Errors were easy to miss** — dialog closed on failure; error only rendered on Recurring tab. User navigated to Manual/Bookings immediately after click.
2. **Selection matching fragility (P0035)** — RPC matched rows by `rule_id + occurrence_date + start_time`. Time/date string variants from PostgREST/JS (`06:00` vs `06:00:00`, ISO date prefixes) could fail the join silently → RPC error or zero inserts.
3. **Response parsing gap** — if Supabase returned jsonb as a JSON string, `parse_materialize_client_result` treated it as invalid → `"No bookings were created"` even when DB succeeded.
4. **Migration dependency** — app calls `staff_materialize_client_recurring_selection` (migration 31+). If not applied, RPC missing; error message was generic.

## Fixes implemented

### Migration 32 — `supabase/32_materialize_selection_schedule_line.sql`

- `private.normalize_occurrence_time` / `normalize_occurrence_date`
- Selection RPC prefers **`schedule_line_id`** from list payload; falls back to normalized date/time
- Clearer P0035 message with matched/expected counts

### App layer

- Pass `schedule_line_id` from dialog to RPC
- Normalize date/time before RPC call
- Robust `booking_ids` parsing (array or JSON string)
- Dev console logging for RPC data/errors
- Explicit message when selection RPC missing in DB

### UI

- Dialog **stays open on error** with inline alert
- **Panel-level banner** (visible on all tabs) for materialize success/failure
- **Always refresh dashboard** after materialize attempt (success or failure)

## Verification

- `npm run lint` — pass
- `npm run test` — 196 passed

## Next action (user)

1. Apply in Supabase SQL editor (in order): **31 → 32**
2. Retry materialization for client `4d431242-594a-49ea-9506-cd44c9fa0b86`
3. If it still fails, read the **red banner above tabs** — it now shows the exact RPC error
4. Optional SQL smoke test: `supabase/tests/materialize_selection_schedule_line_regression.sql`
