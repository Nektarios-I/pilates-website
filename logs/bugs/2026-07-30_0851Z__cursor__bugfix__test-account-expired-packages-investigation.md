# Log Entry

- Date: 2026-07-30
- Actor: cursor
- Category: bugfix
- Topic: TEST TEST account — no packages for booking vs packages visible in admin
- Branch: (investigation only; no code changes)
- Status: diagnosed — not a booking-system regression; account state + UX mismatch

## Purpose

Investigate why `ioannou9988@gmail.com` (TEST TEST) cannot book (no packages) while staff membership UI shows several packages, and why those packages cannot be removed after “clearing” bookings.

## Inputs / Context Used

- Account: TEST TEST / `ioannou9988@gmail.com` / auth user `4d431242-594a-49ea-9506-cd44c9fa0b86`
- Supabase project `xzlirjwzpmvugkbhtzxw`
- Code paths: `get_active_packages`, staff `list_user_memberships` / `remove_membership`, FK `ON DELETE RESTRICT` on bookings → user_packages
- Daily job: `expire_packages()` via `expire-packages-daily` cron

## Actions Performed

1. Located auth user and profile.
2. Queried `user_packages`, `bookings`, `booking_credit_charges`, `get_active_packages()`.
3. Compared admin list query vs client bookable filter.
4. Fleet-wide check for users with memberships but zero bookable packages.
5. Checked recurring prebook rules for this client.

## Result

### Root cause

**Not a corrupted account and not a general booking-system break.** Packages on this account are **expired**. Booking correctly ignores them; admin correctly lists historical memberships.

| Package | Status | Credits left | Expired at (UTC) | Bookings still referencing it |
|---|---|---|---|---|
| Mat · 1 Month · 4×/week | expired | 14 | 2026-07-20 | 2 finished |
| Reformer · 1 Month · 4×/week | expired | 9 | 2026-07-20 | 6 finished + 9 cancelled |
| Reformer · Single Class | expired | 1 | 2026-07-27 | 1 finished + 6 cancelled |

- `get_active_packages(user)` → **[]** (requires `status = 'active'`, not past `expires_at`, credits > 0 or null).
- Staff membership panel loads **all** `user_packages` rows (including expired) and shows `Status: expired`.
- Remove fails with FK `23503` because cancel/finish **does not delete** booking rows; `bookings.user_package_id` and `booking_credit_charges.user_package_id` are `ON DELETE RESTRICT`. Zero live `booked` rows remain, but history still blocks delete.

### Fleet scope

Only this user has **expired** packages with leftover credits. Other non-bookable users are `used_up` or `cancelled` — expected. Currently bookable: 2 other clients with active single-class packs.

Also: this account still has an **active** recurring prebook rule labeled `Test` (Mon 06:00). That is unrelated to “no packages” but should be deactivated if testing is done.

### Recommendation

- **Do not recreate the account.** Apply a new membership from staff Membership → Apply.
- Optionally deactivate the recurring `Test` rule.
- Optional UX follow-ups (not blockers): clearer active vs historical membership sections; “cannot remove because of booking history” copy; optional reactivate/extend for expired packs with remaining credits.

## Verification

- SQL confirmed empty `get_active_packages` for this user.
- SQL confirmed three expired `user_packages` with remaining credits.
- SQL confirmed booking history still linked (24 bookings total across packages; 0 status=`booked`).
- Fleet query confirmed no widespread “active but unbookable” corruption.

## Blockers / Risks

None for production clients with fresh active packs. Confusion risk if staff assume expired rows with credits are bookable.

## Next Recommended Action

Staff: apply a fresh package to TEST TEST (and optionally deactivate recurring rule). Product: decide whether UX copy / reactivate flow is worth a small follow-up ticket.
