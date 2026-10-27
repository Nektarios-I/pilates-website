# Booking history statuses and client dropdown

- date: 2026-10-27
- actor: cursor
- category: implementation
- topic: booking-history-status-client-dropdown
- branch: master
- commit: pending
- related plan: none
- related prompt: update Booking History statuses and replace client search with a dropdown
- status: implemented; tests passed; push pending

## Purpose

Align the Booking History status filter with the live booking statuses, including Not attended, and replace the free-text client search with a dropdown of all clients.

## Actions performed

Expanded the status filter to all, booked, waitlisted, finished, attended, not_attended, no_show, and cancelled. Each status now filters to that exact value. Replaced the search field with a client select loaded from the manageable clients list. Filtering uses `user_id` in the bookings query.

## Files changed

- `src/features/bookings/staff-bookings.ts`
- `src/features/bookings/staff-bookings.test.ts`
- `src/app/(marketing)/staff/bookings/actions.ts`
- `src/app/(marketing)/staff/bookings/actions.test.ts`
- `src/app/(marketing)/staff/bookings/booking-history-panel.tsx`
- `src/app/(marketing)/staff/bookings/page.tsx`

## Verification

`npx vitest run src/features/bookings/staff-bookings.test.ts src/app/(marketing)/staff/bookings/actions.test.ts` — 2 files, 17 tests passed before removing the unused search helper; re-run before push.

## Next recommended action

Push to master for production deploy.
