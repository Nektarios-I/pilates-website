# Booking policy verification & regression pass

**Date:** 2026-07-09  
**Actor:** cursor  
**Category:** testing  
**Scope:** No-waitlist + 2-hour client cancel cutoff verification

## Summary

Full code-level verification pass for public booking (no waitlist, P0015 on full) and client self-cancel (2-hour cutoff, P0029). Expanded unit tests (+6), fixed stale public copy, improved SQL regression script with boundary scenarios. All 174 unit tests pass. Playwright: 54/55 pass (1 pre-existing navigation flake on mobile-412). Live Supabase RPC scenarios not executed in this environment.

## Verification status

**PASS WITH GAPS** — code and automated tests align with policy; migration 24 must be applied and manual staging QA required.

## Commands run

| Command | Result |
|---------|--------|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 174 tests |
| `npm run test:e2e` | 54/55 PASS — 1 navigation flake (mobile-412 primary routes) |

## Files changed this phase

- `src/app/(marketing)/book/booking-panel.tsx` — legacy panel waitlist copy → Full/legacy messaging
- `src/app/(marketing)/account/bookings/page.tsx` — remove waitlist marketing copy
- `supabase/README.md` — document migration 24 policy (remove stale "deferred")
- `src/lib/booking/cancellation-policy.ts` — boundary helper + SQL alignment comment
- `src/lib/booking/cancellation-policy.test.ts` — exact 2h boundary tests
- `src/app/(marketing)/book/actions.test.ts` — P0008 insufficient credits
- `src/app/(marketing)/book/booking-calendar.test.tsx` — policy text in confirm panel
- `src/app/(marketing)/account/account-content.test.tsx` — cancel gating + legacy waitlist
- `supabase/tests/booking_policy_regression.sql` — boundary + credit helper scenarios

## Next recommended action

**NEEDS DB/STAGING VALIDATION FIRST** — run `booking_policy_regression.sql` on staging with migration 24 applied, then manual UI QA on `/book` and `/account`.
