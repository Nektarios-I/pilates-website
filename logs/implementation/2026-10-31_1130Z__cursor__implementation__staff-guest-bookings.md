# Staff guest bookings (Option A)

- **Date:** 2026-10-31
- **Actor:** cursor
- **Category:** implementation
- **Topic:** staff-guest-bookings
- **Branch:** master
- **Related plan:** `logs/planning/2026-10-31_0945Z__cursor__planning__staff-guest-bookings.md`
- **Status:** implemented; migration applied with gate OFF; app deploy via push

## Change

- Migration `supabase/48_staff_guest_bookings.sql`: guest shape on `bookings`, request/audit tables, `staff_book_guests` / `staff_update_guest_booking`, cancel/NA guards, `sessions_one_scheduled_slot` + race-safe `ensure_session_slot`, feature gate `staff_guest_bookings` default OFF.
- Staff Client Booking Manager: Guest booking entry + dialog (SlotBookingPicker, multi-guest batch, request id).
- Guest detail popup (edit label/note, cancel).
- Guest-aware month/day/week readers and subset counts.

## Production DB

- Project: `xzlirjwzpmvugkbhtzxw`
- Integrity snapshot after schema apply: bookings 824 / booked 240 / scheduled 340 / active packages 58 / guest rows 0
- Gate `staff_guest_bookings`: OFF until guest-aware app is live

## Verification

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test`: 420 passed
- `npm run build`: pass
- Authenticated browser smoke: pending staff fixture / gate enable
- Concurrent capacity SQL: structural safeguards applied; true dual-session concurrency not executed (no isolated DB / dual session harness)

## Next

1. Push app; confirm Vercel READY on expected commit.
2. Enable `staff_guest_bookings`.
3. Controlled smoke on designated test session.
