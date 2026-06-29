# Phase 5: Instructor/owner/admin day-bookings page

## Task
Operational day view at `/staff/day-bookings` for instructor, owner, and admin roles.

## Architecture
- `src/features/bookings/day-bookings.ts` — filters, timezone hour-range logic, grouping, summaries
- `src/app/(marketing)/staff/day-bookings/actions.ts` — `list_day_bookings`, `list_day_booking_instructors`
- `src/app/(marketing)/staff/day-bookings/day-bookings-panel.tsx` — date, hour range, optional instructor filter
- `src/app/(marketing)/staff/day-bookings/page.tsx` — teaching-staff gate + SSR initial load

## Behavior
- Default view: today, 06:00–22:00 (studio-local / Europe/Nicosia for hour filtering)
- Sessions grouped by time slot with separate **Active** and **Cancelled / no-show** rosters
- Instructors: only their assigned sessions (`instructor_id` filter + booking RLS)
- Owner/admin: all sessions; optional instructor filter
- Past days supported via date picker (`scheduled` + `completed` sessions)

## Wiring
- Account menu → **Day bookings** (all staff roles)
- `/staff/day-bookings` added to `safe_auth_next_path` allowlist

## Verification
- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `day-bookings.test.ts`, `staff-bookings.test.ts`, `safe-auth-redirect.test.ts` — 15/15 pass
- `npm run build` — pass

## Next
- Phase 3: account mirror table
- Phase 6: final regression pass across owner TODO items
