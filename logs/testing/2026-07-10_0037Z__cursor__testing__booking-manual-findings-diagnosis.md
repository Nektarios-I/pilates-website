# Booking manual-test findings diagnosis

**Date:** 2026-07-10  
**Actor:** cursor  
**Category:** testing  
**Scope:** Staff manual booking, recurring rules, package stale state, booking horizon

## Summary

Four manual-test findings investigated. Issue 3 (package stale state) fixed with `router.refresh()` + `revalidatePath('/book')`. Issues 1, 2, 4 are primarily incomplete UX / config-disabled behavior requiring product decisions before larger implementation.

## Changes this phase

- `booking-calendar.tsx` — `router.refresh()` after successful book
- `schedule-actions.ts` — `revalidatePath('/book')` after successful book
- `booking-calendar.test.tsx` — assert refresh called

## Next phase

- Staff manual booking calendar alignment (Issue 1)
- Recurring skip validation + labels (Issue 2)
- Public horizon enablement decision (Issue 4)
