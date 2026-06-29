---
date: 2026-06-23
actor: cursor
category: implementation
topic: owner-todo-regression-fixes-phase3-4-5
related prompt: Fix tests, remove test API, smoke e2e, Phase 3 mirror, slot booking rule, Phase 4 filters, day-bookings instructor removal
status: complete
---

## Implemented

- Fixed stale unit tests (`indexing.test.ts`, `site-footer` aria-label)
- Removed `/api/test-supabase` debug route; added `e2e/smoke.spec.ts`
- Phase 4 booking history filters: all / booked / cancelled / finished + optional session date range
- Day bookings: removed non-functional instructor filter
- Phase 3: `16_account_safety_mirror.sql` — mirror table, triggers, `backfill_account_safety_mirror()`
- One slot per client: `17_booking_one_per_time_slot.sql` + `private.user_has_active_booking_at_slot` (P0013)

## Verification

- `npm run lint` — pass
- `npx tsc --noEmit` — pass (after build refresh)
- `npm test -- --run` — 99/99 pass
- `npm run build` — pass
- `npm run test:e2e` — 50/50 pass (smoke login selector fixed)

## DB migrations to run (Supabase SQL editor)

1. `supabase/16_account_safety_mirror.sql`
2. `supabase/17_booking_one_per_time_slot.sql`

## Next

- User commit/push
- Manual: try booking two parallel sessions at same time → expect friendly P0013 message
