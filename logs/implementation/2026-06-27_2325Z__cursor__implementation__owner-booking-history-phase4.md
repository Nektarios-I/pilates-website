# Phase 4: Owner/admin booking history page

## Task
Complete admin/owner booking history at `/staff/bookings` with filters, navigation, and verification.

## Architecture
- `src/features/bookings/staff-bookings.ts` — types, mapping, search/sort/format helpers
- `src/app/(marketing)/staff/bookings/actions.ts` — `list_staff_bookings` server action (RLS + owner/admin gate)
- `src/app/(marketing)/staff/bookings/booking-history-panel.tsx` — client filters UI
- `src/app/(marketing)/staff/bookings/page.tsx` — auth gate + initial load

## Changes (this session)
- Added **Booking history** link to account menu (owner/admin section).
- Added `/staff/bookings` to `safe_auth_next_path` allowlist + test.
- Exported `STAFF_BOOKINGS_LIMIT` from feature module; panel uses shared constant.
- `list_staff_bookings` returns `{ bookings, error }`; panel surfaces load failures.
- Query orders by session `starts_at` (foreign table) so the 250-row cap matches session recency.

## Filters
- Status (all / booked / waitlisted / cancelled / attended / no_show)
- Session window (all / upcoming / past) via `sessions.starts_at`
- Client name or email search (client-side on fetched set)

## Verification
- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `staff-bookings.test.ts`, `safe-auth-redirect.test.ts` — 10/10 pass

## Next
- Phase 3: account mirror table
- Phase 5: instructor/owner/admin day-bookings page
- Manual smoke: sign in as owner/admin → Account → Booking history → apply filters
