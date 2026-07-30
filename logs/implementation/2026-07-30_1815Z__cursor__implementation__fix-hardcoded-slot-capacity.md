# Fix hardcoded slot capacity fallback

**Date:** 2026-07-30  
**Actor:** cursor  
**Category:** implementation  
**Scope:** Empty `/book` slots used hardcoded capacity 6 instead of session_cards.capacity

## Summary

`get_slots_for_day` now resolves capacity via `resolve_slot_capacity(session, card)` — no hardcoded 6. Call sites pass the selected card capacity. Day Bookings occupancy stays on session cards; same-session multi-booking aggregation covered by test (1→2 / 4).

## Verification

Targeted vitest: session-availability + day-bookings + time-slot-picker — 26 passed.
