# Log Entry

- Date: 2026-09-05
- Actor: cursor
- Category: bugs
- Topic: Month calendar overflow and day-view clock labels
- Branch: master
- Commit: pending
- Related plan: logs/planning/2026-09-05_0800Z__cursor__planning__month-calendar-day-detail.md
- Related prompt: Phone testing — calendar text overflow; day slots should show 6:00 not 1–24
- Status: fixed in code; tests updated

## Purpose

Fix two staff phone issues: month-cell copy overflowing its boxes, and day-detail hours showing bare numbers instead of clock times.

## Inputs / context used

- Owner phone test on live Day Bookings month calendar
- Existing month-calendar helpers and Day Detail Popup markup

## Actions performed

- Forced calendar cells to shrink (`min-w-0 overflow-hidden`), smaller mobile type, compact `None` / `3R 1M` copy
- Changed hour labels from `00`–`23` to `0:00`–`23:00` in a wider left-edge column
- Updated unit, component, and E2E assertions

## Files changed or inspected

- `src/features/bookings/month-calendar.ts`
- `src/features/bookings/month-calendar.test.ts`
- `src/app/(marketing)/staff/day-bookings/month-calendar-section.tsx`
- `src/app/(marketing)/staff/day-bookings/month-calendar-section.test.tsx`
- `e2e/staff-bookings.spec.ts`

## Commands run

- `npx vitest run src/features/bookings/month-calendar.test.ts src/app/(marketing)/staff/day-bookings/month-calendar-section.test.tsx` — 28 passed

## Result

Calendar cells clip/fit on a 7-column phone grid. Day popup left edge shows clock times such as `6:00` and `7:00`. Desktop keeps weekday + full “No sessions” copy and larger type.

## Verification

- Unit/component tests passed after label and overflow changes

## Blockers / risks

- Authenticated visual check still needs a phone after deploy

## Next recommended action

Run calendar tests, commit, push, then re-check on phone.
