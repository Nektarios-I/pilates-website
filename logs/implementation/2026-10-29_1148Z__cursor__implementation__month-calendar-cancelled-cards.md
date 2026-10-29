# Month calendar cancelled / not-attended cards

- **Date:** 2026-10-29
- **Scope:** Staff day-bookings month calendar day detail
- **Status:** implemented; deploy via push to `master`

## Change

- Include cancelled bookings in month-calendar load (removed `.neq('status','cancelled')`).
- Per session with ≥1 cancelled booking, show a red **CANCELLED** card with count.
- Click opens popup: client name, cancel time, cancelling account (or note / Not recorded).
- `not_attended` booking boxes use warning/yellow surface.
- Select now embeds `cancelled_by` profile + `cancelled_at` / actor note.

## Verification

- `vitest` month-calendar + day-bookings actions/UI + staff-booking-queries: 55 passed
- `tsc --noEmit`: passed

## Next

Confirm Vercel production deployment READY after push.
