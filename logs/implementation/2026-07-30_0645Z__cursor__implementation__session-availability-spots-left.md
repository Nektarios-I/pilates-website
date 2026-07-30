# Session availability feature

**Date:** 2026-07-30  
**Actor:** cursor  
**Category:** implementation  
**Scope:** Client + staff remaining capacity display

## Summary

Shared `session-availability` contract (`booked` counts vs `sessions.capacity`). Client slot pills show “X spots left”; staff manual booking shows “X / Y booked”; Day Bookings session header shows occupancy. Full slots remain disabled; RPC `P0015` remains authoritative for oversubscription.

## Verification

| Check | Result |
| --- | --- |
| lint | pass |
| typecheck | pass |
| vitest (243) | pass |
| build (after `.next` clean) | pass |
| e2e chromium + mobile-375 + authenticated-staff-bookings (25) | pass |

## Next

Review and merge. Deploy to production to expose the UI on live `/book` and `/staff/day-bookings`.
