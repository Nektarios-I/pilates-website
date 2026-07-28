# Finalize past bookings as finished

**Date:** 2026-07-28  
**Actor:** cursor  
**Category:** implementation  
**Scope:** Booking History past `booked` → `finished`

## Summary

Added `finished` booking status, `finalize_past_bookings()` RPC with hourly pg_cron, one-shot backfill, and Booking History catch-up call + finished filter. Production DB already backfilled (13 finished; 0 remaining past booked).

## Verification

Unit tests for staff bookings actions/status formatting; DB counts confirmed via Supabase SQL.

## Next

Deploy app so History UI shows Finished badges and calls finalize on load.
