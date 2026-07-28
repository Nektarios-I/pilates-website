# Staff Booking History / Day Bookings load failure — forensic investigation

**Date:** 2026-07-28  
**Actor:** cursor  
**Category:** testing / bug-analysis  
**Scope:** `/staff/bookings`, `/staff/day-bookings` vs working `/staff/client-bookings`

## Summary

Production pages Booking History and Day Bookings fail to load any bookings after migration 18 added `bookings.created_by_user_id → profiles`. Both pages still use ambiguous PostgREST embed `profiles!inner`, which returns **PGRST201** (HTTP 300). Server actions swallow the real error into generic UI copy. Client Booking Manager works because it never joins `profiles` from `bookings` — it filters by `user_id` and loads client identity separately.

## Evidence

- Browser (admin login): Day Bookings shows `Unable to load bookings for this day. Please try again.`
- Browser: Booking History shows `Unable to load bookings. Please try again.`
- Browser: Client Bookings for MARIA ERAKLEOUS shows `Reformer · 30 Jul 19:00` / `booked · Client`
- DB: Maria booking `2c230621-…` status `booked`, starts `2026-07-30 16:00:00+00` (19:00 Nicosia)
- REST: `profiles!inner` → PGRST201; `profiles!bookings_user_id_fkey!inner` → 200 OK

## Verification status

**ROOT CAUSE CONFIRMED** — no code fix applied (analysis-only request).

## Next recommended action

Disambiguate embeds to `profiles!bookings_user_id_fkey!inner` in:
- `src/app/(marketing)/staff/bookings/actions.ts`
- `src/app/(marketing)/staff/day-bookings/actions.ts`

Then verify Maria appears on Day Bookings for 2026-07-30 and in Booking History search.
