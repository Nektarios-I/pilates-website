# Staff booking alignment with public slot engine

**Date:** 2026-07-10  
**Actor:** cursor  
**Category:** implementation  
**Scope:** Staff manual booking + recurring slot alignment

## Summary

Aligned staff manual booking and recurring setup/skips with public `/book` slot generation (`get_slots_for_day`, `ensure_session_slot_at`). Added shared `SlotBookingPicker`, weekly pattern helpers, server skip validation (migration 25).

## Verification

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run test` — 183 passed (46 files)

## Next action

Apply migration `25_recurring_skip_validation.sql` on staging, then manual QA of staff manual + recurring flows.
