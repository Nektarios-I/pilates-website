# Recurring weekly slot picker + rule delete

**Date:** 2026-07-10  
**Actor:** cursor  
**Category:** implementation  
**Scope:** Recurring booking UX fix + hard delete

## Summary

Fixed recurring slot picker showing only Saturday (past-slot filtering on current calendar week). Replaced with per-weekday dropdowns from default studio hours. Added `delete_recurring_prebook_rule` RPC and UI delete button.

## Verification

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run test` — 185 passed

## Next action

Apply migration `26_delete_recurring_rule.sql` on staging, then QA recurring slot selection for all weekdays.
