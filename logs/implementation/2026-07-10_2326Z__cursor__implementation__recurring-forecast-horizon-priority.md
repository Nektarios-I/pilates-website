# Recurring forecast UI + 14-day horizon + recurring priority gate

**Date:** 2026-07-10  
**Actor:** cursor  
**Category:** implementation  

## Summary

- Forecast uses client-level chronological token allocation (all active rules, soonest first).
- UI shows separate **Planned/Booked/Failed** and **Credits OK / Not enough tokens** badges.
- Public + staff manual booking: 14-day horizon; slots blocked until recurring materialization processed (P0032).
- Adding a weekly slot triggers `staff_materialize_recurring_prebooks()` so slots open promptly.

## SQL required

Apply `supabase/27_booking_horizon_recurring_priority_forecast.sql` on dev/staging/production.

## Verification

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run test` — 187 passed

## Next action

Manual QA: client with 2 tokens + 4 recurring slots → forecast shows yellow on extras; public `/book` shows "Recurring" on blocked slots until materialization runs.
