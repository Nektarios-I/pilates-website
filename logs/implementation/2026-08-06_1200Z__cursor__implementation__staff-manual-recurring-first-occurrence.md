# Manual booking uncapped + recurring first occurrence + three-month preview

**Date (UTC):** 2026-08-06  
**Agent:** Cursor  
**Scope:** Staff manual booking horizon, recurring first_occurrence_date, 3-month preview, multi-select occurrence cancel

## Summary

- Staff/instructor manual booking no longer capped at 14 days (past still blocked); public self-booking unchanged.
- Recurring schedule lines require `first_occurrence_date`; materialization/forecast respect it.
- Staff UI shows three-calendar-month planned sessions preview and a multi-select cancel modal (skips + existing cancel_booking).

## Apply

Run `supabase/41_staff_manual_uncapped_recurring_first_occurrence.sql` on each environment after 40.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run test` — 327 pass
