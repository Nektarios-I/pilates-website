# Enable staff guest bookings in production

- **Date:** 2026-10-31
- **Actor:** cursor
- **Category:** deployment
- **Topic:** staff-guest-bookings-gate-on
- **Related:** `logs/implementation/2026-10-31_1130Z__cursor__implementation__staff-guest-bookings.md`

## Change

Enabled `private.feature_gates.staff_guest_bookings` after confirming:

- Production Vercel deploy READY on `f4ab664`
- Migration 48 already applied (guest columns/RPCs present)
- Owner requested production use

## Verification

| Check | Result |
| --- | --- |
| Deploy `f4ab664` | READY / production |
| Gate before | `enabled = false` |
| Gate after | `enabled = true` (2026-10-31 14:40:14 UTC) |

## Next

Staff smoke: Client Booking Manager → Guest booking → create one test guest on a spare session, confirm calendar card + cancel.
