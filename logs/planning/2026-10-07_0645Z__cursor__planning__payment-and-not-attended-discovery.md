# Payment Tracking and Not Attended Feature Discovery Report

- date: 2026-10-07
- actor: cursor
- category: planning
- topic: payment-and-not-attended-discovery
- branch: master
- commit: 4aeec7c7c02ec338b786db69c588fc9b720b9b1b
- related plan: none
- related prompt: offline payment tracking and Not attended replacement-credit discovery
- status: discovery complete; implementation not started

## 1. Executive Summary

The studio already has a credit-pack booking engine, a staff Manage Packages screen, a package audit table, and a Day Bookings month calendar with a nested client popup. It does not record whether a package was paid. `user_packages.payment_ref` exists and is unused. Booking completion is automatic: `public.finalize_past_bookings()` turns `booked` into `finished` after the session ends. Statuses `attended` and `no_show` are allowed and described in comments, and they are unused in the live database and in application write paths.

The safe direction is:

- Keep package lifecycle (`active`, `expired`, `used_up`, `cancelled`) separate from payment.
- Store a current payment state on the owned package and an append-only payment/audit event for every change.
- Default every existing owned package to **Payment not recorded**. Do not infer paid or unpaid.
- Snapshot the catalog price onto new owned packages at creation. Historical agreed prices cannot be reconstructed.
- Mark Not attended with one SQL transaction that leaves the original package balance unchanged and inserts one new single-use owned package, linked to that booking by a unique key.
- Reuse `partition_packages_by_lifecycle()` for popup groups. Stop using `get_active_packages()` as the popup package source, because that function returns only currently bookable rows.
- Show cancelled and Not attended rows in the day-detail popup, and keep them out of the existing active calendar counts and out of live capacity.

Principal risks:

- `cancel_booking` refunds credits onto the original package. Not attended must not call it.
- `finalize_past_bookings()` only updates `status = 'booked'`. A new status is safe from that job only if the status is no longer `booked`.
- Recurring materialization is idempotent on `(rule_id, occurrence_starts_at)` only while the log row remains. Not attended must not delete that log.
- Staff membership writes and their audit rows are separate JavaScript steps. A failed audit insert is logged and ignored. Payment and Not attended need a single database transaction.
- `handle_user_package_status()` can rewrite `cancelled` to `used_up` when `credits_remaining <= 0` on any update. Payment updates must not trip that.
- The client popup loads at most 120 bookings and then renders 12. That is silent truncation.
- The month calendar drops every non-active status before the UI sees it. Adding a color without changing `map_month_calendar_booking()` will not show cancelled or Not attended rows.
- Live data has no multi-credit bookings, no mixed Reformer/Mat charges, and no unlimited packages, but the booking engine supports all three. Those cases need an explicit rule before the action is offered.

## 2. Investigation Scope and Evidence

### Repository

- Branch `master`, commit `4aeec7c` (`feat: extend Saturday studio hours from 07:00-11:00 to 07:00-12:00`).
- Working tree at inspection: only unrelated `.cursor/skills/ui-ux-pro-max/scripts/__pycache__/*.pyc` modifications. No application edits were made for this audit.
- Canonical SQL is the numbered `supabase/*.sql` series. `supabase/README.md` says `supabase/migrations/lates_migrations_01-03.sql` is an old copy and must not be applied. Latest script in the repo is `supabase/44_saturday_hours_1200.sql`.
- Deploy path in `docs/general/deployment-runbook.md` is manual SQL in the Supabase editor, then a Vercel production deploy from `master`. There is no migration runner in `package.json`.

### Database inspected

Read-only PostgREST inspection against the Supabase project in local `.env.local`:

- Host: `xzlirjwzpmvugkbhtzxw.supabase.co`
- `NEXT_PUBLIC_SITE_URL` in that file is `localhost:3000`
- The repository does not name a separate staging project
- This database holds real operational volume, so it was treated as the live studio database

Verified live, without writing rows or calling mutation RPCs:

| Check | Result | Evidence |
| --- | --- | --- |
| Owned-package columns | Match `supabase/01_schema.sql` `user_packages`, including `payment_ref` | OpenAPI `user_packages` |
| Booking columns | Include `booking_source`, `created_by_user_id`, `recurring_materialization_log_id` from script 18, and status values that include `finished` from script 38 | OpenAPI + status counts |
| `user_package_events` | Present, script 39 | OpenAPI + 135 rows |
| Saturday hours | `get_default_studio_hours('2026-10-10')` returns `07:00–12:00` | Matches script 44 |
| Function bodies | Not dumped | RPC source text is not exposed by PostgREST |

Live aggregates (no client names, phones, or emails exported):

| Measure | Count |
| --- | --- |
| Bookings | 443 |
| `booked` / `finished` / `cancelled` | 294 / 81 / 68 |
| `waitlisted` / `attended` / `no_show` / any other booking status | 0 / 0 / 0 / 0 |
| Sessions `scheduled` / `cancelled` / `completed` | 213 / 0 / 0 |
| Past `booked` rows whose session has already ended | 0 |
| Future `finished` rows | 0 |
| Owned packages | 81 |
| `active` / `used_up` / `expired` / `cancelled` | 10 / 58 / 11 / 2 |
| `payment_ref` populated | 0 |
| Catalog packages with price 0 | 0 |
| Unlimited owned packages (`credits_remaining` null) | 0 |
| Credit-charge rows | 443, one per booking |
| Charges with `credits_used > 1` | 0 |
| Mixed Reformer+Mat bookings | 0 |
| Booking sources `recurring` / `staff_manual` / `client` | 300 / 120 / 23 |
| Profiles / profiles with a phone | 67 / 66 |
| Package events `package_applied` | 80 (one current owned package has no apply event) |

`attended` and `no_show` are legal and unused. Completion is in use: 81 `finished` rows, and no overdue `booked` rows at inspection time.

### External references (design only)

- W3C APG Accordion and Disclosure patterns: heading + button, `aria-expanded`, `aria-controls`. https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
- W3C APG modal dialog: focus stays in the top dialog, Escape closes that dialog, focus returns to the opener. https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

### Not verified

- Byte-for-byte equality of every live function with the repo file of the same name.
- `cron.job` rows. The hourly finalize job is defined in `supabase/38_finalize_past_bookings.sql`. Live data is consistent with it running (no past `booked` rows left behind), which is evidence of effect, not a direct cron-catalog read.
- Whether an owner has manually updated booking status in the SQL editor. The application has no writer for `attended` or `no_show`.

## 3. Current Package and Payment Architecture

### Catalog and owned packages

`public.packages` (`supabase/01_schema.sql` lines 90–112) is the catalog: `class_type` `reformer|mat`, `package_type` including `credit_pack`, `drop_in`, `unlimited`, `price numeric(10,2)`, `credits_included` null meaning unlimited, `validity_days` null meaning no expiry.

Live catalog is 14 active rows, all `drop_in` or `credit_pack`, prices €10–€520, no `max_per_user`, no zero prices. Currency is euro in the UI (`src/lib/packages/pricing-display.ts` `format_package_price_eur`) and there is no currency column.

`public.user_packages` (schema lines 173–188) stores the owned balance: `credits_remaining`, `purchased_at`, `starts_at`, `expires_at`, `status` in `active|expired|used_up|cancelled`, and `payment_ref text`. The comment calls `payment_ref` an optional Stripe PaymentIntent id. Application code never reads or writes it. Live non-null count is 0.

There is no agreed-price column. Staff price edits update `packages.price` in place (`src/app/(marketing)/staff/pricing/actions.ts`). A past purchase cannot be priced from history. `package_applied` events store status, credits, expiry, and `package_id`, not price (`apply_membership` in `src/app/(marketing)/staff/membership/actions.ts` lines 249–261).

`BEFORE INSERT` trigger `handle_new_user_package` copies `credits_included` and computes `expires_at` from `validity_days` when those fields are null (schema lines 336–360).

### Lifecycle

Stored status and effective status differ. `get_effective_package_status()` in `src/lib/packages/lifecycle.ts` lines 62–87 orders: cancelled, then expired (`expires_at <= now` or stored `expired`), then exhausted (`credits_remaining <= 0` or stored `used_up`), then expiring soon (7 days), then active.

`partition_packages_by_lifecycle()` (lines 148–178) puts `active` and `expiring_soon` in the Active group. Manage Packages and Account already use it (`membership-panel.tsx` lines 74–80, `account-content.tsx`).

`public.expire_packages()` (script 39) sets `active` to `expired` when `expires_at <= now()`. Live active-but-past-expiry count was 0.

`handle_user_package_status()` (script 39, lines 95–113) on every update:

1. If `credits_remaining <= 0`, forces `used_up`.
2. If `expires_at <= now()` and status is still `active`, forces `expired`.

A cancelled row with zero credits would become `used_up` on the next update. Both live cancelled packages currently have credits remaining greater than 0, so they are not in that state today. The trigger is still unsafe for a payment-column update later.

Deactivate sets `status = 'cancelled'` and does not clear credits or write a financial waiver (`deactivate_membership`, actions.ts lines 284–304). Remove hard-deletes the row. Bookings and `booking_credit_charges.user_package_id` use `ON DELETE RESTRICT`, so a package with booking history cannot be deleted (actions.ts lines 326–348). `user_package_events.user_package_id` is `ON DELETE SET NULL` (script 39 line 18), so a successful delete keeps the audit row with a null package id. There is no payment row to retain today.

### Staff actions and permissions

Manage Packages is `/staff/membership`, title “Manage Packages” (`page.tsx` lines 12–17). Panel groups are Active (open), Expired, Exhausted, Cancelled (closed), with `aria-expanded` (`membership-panel.tsx` lines 64–69 and 492).

`apply_membership`, `deactivate_membership`, `remove_membership`, `update_membership_credits`, and `extend_membership_expiry` all require `instructor|admin|owner`, then write with the service-role client. Audit insert is a second call. Failure is `console.error` only (actions.ts lines 74–97). That is not an atomic audit.

`purchased_at` is loaded and not shown on the card (card render starts at line 553). Repeat purchases of the same catalog name are distinguishable in data, not in the current UI.

`get_active_packages(uuid)` (script 21, lines 108–156) returns only `status = 'active'`, unexpired, with credits left. Staff may pass another user’s id. It is the wrong source for a popup that must show expired, exhausted, and cancelled packages.

Booking eligibility ignores payment. `private.book_session_core` in script 41 checks package status `active`, expiry, and credits. It does not read `payment_ref` or `packages.is_active`.

### Audit actions allowed today

`user_package_events.action` check (script 39 lines 22–29):

`package_applied`, `credits_adjusted`, `expiry_extended`, `package_reactivated`, `package_cancelled`, `package_removed`, `package_remove_failed`.

RLS: staff can select; `is_admin()` can insert. Service role bypasses RLS, which is how the app writes events. There is no payment action value.

Live event counts: applied 80, credits adjusted 24, expiry extended 11, reactivated 0, cancelled 6, removed 8, remove failed 6.

## 4. Current Booking, Attendance, and Credit Architecture

### Statuses

Booking check after script 38, lines 17–28:

| Status | Comment in script 38 | Application writer | Live rows | Current UI meaning |
| --- | --- | --- | --- | --- |
| `booked` | open | `book_session_core` | 294 | Active. Counts toward calendar totals and live capacity. |
| `waitlisted` | open | core only if waitlist allowed; public waitlist removed in script 24 | 0 | Treated as active by `ACTIVE_BOOKING_STATUSES`. |
| `cancelled` | voided | `cancel_booking` | 68 | Day list “cancelled”. Month calendar drops the row. |
| `attended` | staff-marked presence | none found | 0 | Grouped with active. History “finished” filter includes it. |
| `no_show` | voided, same comment bucket as cancelled | none found | 0 | Day-booking helper treats it as cancelled. History “finished” filter includes it. No refund function sets it. |
| `finished` | session ended without cancel | `finalize_past_bookings` | 81 | Active for calendar counts. History completed filter. |

TypeScript union: `BOOKING_STATUSES` in `src/features/bookings/staff-bookings.ts` lines 1–7.

Session status check: `scheduled|cancelled|completed` (schema lines 220–221). Live rows are all `scheduled`. No application or SQL writer sets `completed`. Day and month queries keep sessions in `scheduled` or `completed` (`day-bookings/actions.ts` lines 93, 155, 215), so a `cancelled` session would disappear even if bookings remained. None exist now.

### Completion

`finalize_past_bookings()` (script 38 lines 44–50) sets `finished` where `bookings.status = 'booked'` and `sessions.ends_at < now()`. It does not read session status. It does not change `waitlisted`, `attended`, `no_show`, `cancelled`, or `finished`. Granted to `authenticated`, so any signed-in user can invoke the catch-up. Staff booking history calls it before listing (`staff/bookings/actions.ts` lines 41–47). Day Bookings does not. Hourly cron is scheduled at minute 15. At inspection, the catch-up was current: 0 past `booked` rows.

A Not attended status other than `booked` will not be overwritten by this job.

### Credit deduction

`book_session_core` (script 41):

- Capacity counts only `bookings.status = 'booked'` (lines 204–207). `finished` does not block a future rebooking of a new session. It also does not consume a live seat.
- Waitlist inserts do not deduct. Confirmed bookings deduct.
- Null `credits_remaining` stays null (unlimited).
- One `booking_credit_charges` row per `(booking_id, class_type)`.
- `bookings.credits_used` stores reformer + mat credits.
- `bookings.user_package_id` stores one primary package even when two packages pay a mixed session.

`private.pick_client_packages_for_session` (script 22 lines 164–176) picks the earliest `expires_at`, nulls last, then oldest `purchased_at`. Recurring materialization uses that picker. A no-expiry package is consumed after every dated package.

### Cancellation and refunds

Latest `cancel_booking` is script 40, lines 472–624.

- Allowed only for `booked` or `waitlisted`. `finished` raises `P0012`.
- Client self-cancel inside 4 hours raises `P0029`. Staff bypass that cutoff.
- For `booked`, credits are added back onto charge packages, or onto `bookings.user_package_id` when no charge rows exist. Unlimited stays null. `used_up` can return to `active`. Refunds skip packages that are not `active` or `used_up`.
- Charge rows are kept. There is no refund ledger. The booking status is the record that the charge was returned.
- Staff cancel of a recurring booking writes a skip and sets the materialization log to `skipped` with `booking_id` null.
- Client cancel of a recurring booking deletes the log so the occurrence can be materialized again.

Live charge count equals booking count, including cancelled bookings, so the legacy no-charge refund branch is unused in current data and still present in code.

### Recurring idempotency

`recurring_prebook_materialization_log` has unique `(rule_id, occurrence_starts_at)` (script 18 lines 152–153). Live log rows: succeeded 240, skipped 23, failed 13. Deleting a succeeded log is what allows the same occurrence to be created again. Not attended must leave a succeeded log and its `booking_id` in place.

### What “Not attended” must not reuse

`no_show` is grouped as voided beside `cancelled` in the day-booking helper (`day-bookings.ts` line 10) and as a completed history filter (`staff/bookings/actions.ts` lines 77–79). Those two UIs disagree. There is no credit outcome attached to `no_show`. Using `no_show` as the new outcome would collide with that split. A new status is the accurate model.

## 5. Current Day Bookings and Client Popup

Page `/staff/day-bookings` loads three views (`page.tsx` lines 52–93):

1. Day roster via `list_day_bookings`.
2. Week strip via `list_week_day_bookings`.
3. Month calendar via `list_month_calendar`.

### What each view keeps

`is_active_booking_status` (`day-bookings.ts` lines 9–10, 105–110): `booked`, `waitlisted`, `attended`, `finished`.

`is_cancelled_booking_status`: `cancelled`, `no_show`.

| Surface | Rows received | Rows shown | What the count means |
| --- | --- | --- | --- |
| Month cells and day-detail hour counts | Query is unfiltered by booking status, then `map_month_calendar_booking` drops non-active (`month-calendar.ts` lines 203–205) | Active only, colored by session type | Sum of active rows by Reformer/Mat/Private/Intro/Other. Includes `finished`. Excludes `cancelled` and `no_show`. This is not live capacity. |
| Day roster | Same status mapping, split into `active_bookings` and `cancelled_bookings` | Both | Summary `active` and `cancelled`. Cancelled cards use reduced opacity (`day-bookings-panel.tsx` lines 62–63). |
| Week strip | Built from day sessions | `active_bookings` only (`week-day-bookings.ts` lines 152 and 224) | Active occupancy for the week. Cancelled sessions with no active row disappear. |

Live capacity remains `status = 'booked'` inside `book_session_core`. `OCCUPANCY_STATUSES` in `session-availability.ts` lines 13–20 (`booked`, `finished`, `attended`) is a display helper and is not the month-count function.

Class-type card colors (`month-calendar-section.tsx` lines 85–89), from `src/app/globals.css`:

- Reformer: accent gold `#b8a678`
- Mat: info blue surface
- Private and Intro: success green surface
- Other: warning amber surface

Those fills already encode class type. Outcome cannot reuse green or amber as its only signal.

### Client popup

`BookingClientDetailPopup` (`month-calendar-section.tsx` lines 202–366):

- Header shows `compact_name` (first name plus three letters of the surname) and the session type, not the full name.
- Phone is already selected in `BOOKINGS_CLIENT_PROFILE_EMBED` (`staff-booking-queries.ts` lines 10–14) and then discarded. `map_month_calendar_booking` keeps `client_name` only. `to_slot_booking` (month-calendar.ts lines 277–284) keeps the compact name.
- Close is a button. Escape on the client layer uses capture and `stopPropagation` (lines 231–238). The day dialog sets `inert` on its panel while the client dialog is open (line 436). The client dialog is still inside the day dialog’s tab-trap root, and the day backdrop button is outside `inert`, so Tab can leave the client dialog. That is the nested-focus gap to fix.
- Packages come from `get_active_packages`. Empty copy says “No active memberships.”
- Bookings query is limited to 120 newest by `booked_at` (`client-booking-manager/actions.ts` lines 146–172). The popup then shows 12 (`month-calendar-section.tsx` line 345).
- `filter_client_bookings` (`booking-filters.ts`):
  - Upcoming: `booked` or `waitlisted` and session start in the future.
  - Finished: any status except `cancelled` whose session start is in the past. That mixes `finished`, past `booked`, `attended`, `no_show`, and past `waitlisted`.
  - Cancelled: `status === 'cancelled'` only.
- The popup merges upcoming and finished and does not render the cancelled group.
- `load_client_dashboard` also loads recurring rules and forecast per active rule. The popup does not show them. That work is extra for this dialog.

Staff can read `profiles.phone`. After script 37, staff read all profiles; clients read their own row plus the staff directory. The popup query already runs as the signed-in staff user. A second admin query is unnecessary if phone is passed through the calendar row.

Desktop client dialog is `max-w-lg`. Day dialog is `max-w-5xl`. Mobile client dialog is bottom-aligned, `max-h-[96vh]`, square top corners. `motion-reduce:animate-none` is used on the month skeleton. There is no shared dialog primitive; these are custom portals.

Revalidation: membership mutations call `router.refresh()` after a local reload (`membership-panel.tsx` `refresh_memberships`). Day Bookings client data is a client fetch of `load_client_dashboard` with no shared cache key. A payment recorded in one place will not appear in the other until that view reloads.

## 6. Proposed Offline Payment Workflow

Payment is a record that money was taken outside the site. It does not move credits, expiry, or `user_packages.status`.

### States

| State | Meaning | How it is set |
| --- | --- | --- |
| `not_recorded` | Staff have not said whether this package was paid. Default for all 81 current rows and for a new package when staff skip payment. | Column default. |
| `unpaid` | Staff explicitly say the full amount is still owed. The package stays bookable. | “Leave unpaid” at apply time, or “Mark unpaid” from `not_recorded`. |
| `paid` | Full amount recorded as Cash or Card/POS. | “Record payment”. |
| `waived` | Staff forgive an outstanding amount. This is not a refund and not a credit. | “Waive outstanding charge”. |
| `complimentary` | Replacement credit or other zero-charge entitlement. Excluded from money totals. | Set by the Not attended transaction. |

Cancelling a package does not change payment state. A cancelled unpaid package still shows the outstanding amount until a waiver.

### Manage Packages

On every owned package, show purchased date, catalog name, class type, credits, expiry, effective lifecycle, and payment state. Purchased date is what separates two identical packs.

Actions:

- **Record payment** when state is `not_recorded` or `unpaid`, and the row is not complimentary. Method: Cash or Card/POS. Amount is the snapshotted agreed price when present. For historical rows with a null snapshot, show the current catalog price as the suggested full amount and require the staff member to confirm it. The confirmed figure becomes `agreed_price`. Label it as the amount recorded by staff, not as a reconstructed historical till receipt.
- **Mark unpaid** when state is `not_recorded`.
- **Waive outstanding charge** when state is `unpaid` or `not_recorded`, with a required reason. Recommended permission: owner and admin only. See section 15.
- Optional control on the apply form: “Record payment now” with method, default off. Off keeps `not_recorded`. A second control, “Mark unpaid”, is how staff record an explicit debt. Applying a package never marks historical rows unpaid.

Inactive lifecycle groups stay eligible for recording and waiver. Payment does not reactivate a package.

### Same operation from the client popup

Both screens call `public.record_package_payment`, `public.mark_package_unpaid`, and `public.waive_package_charge`. The UI does not update `user_packages` itself.

### Corrections

Append a new event. Do not delete the paid event.

- **Correct method** (Cash vs Card/POS): recommended owner/admin. State stays `paid`.
- **Void a payment record**: recommended owner/admin, required reason, state returns to `unpaid`. The original paid event remains.
- Instructors can record the first payment. They cannot void, change method, or waive, unless the owner decides otherwise.

A second “Record payment” on an already paid package returns the existing payment instead of inserting another.

### Waiver and statistics

Waiver sets `payment_state = 'waived'` and writes `charge_waived` with actor, time, and reason. Credits stay put. Waived amounts are reported on their own and omitted from “still outstanding” and from “recorded payments”.

## 7. Proposed Not Attended Workflow

New booking status: `not_attended`.

Meaning: the session ended, the client was marked absent, the original charge stays consumed, and one new single-use credit was issued for that booking.

### Eligibility matrix

Session status is not an eligibility input. It is `scheduled` for every live session, and `completed` is never written.

| Booking status | Session ended (`ends_at < now()`) | Eligible | Result |
| --- | --- | --- | --- |
| `booked` | No | No | Future or in-progress class. |
| `booked` | Yes | Yes, if the charge rule below passes | Covers the gap before finalize. The same transaction sets `not_attended`, so the hourly job will not later set `finished`. |
| `finished` | Yes (true for all 81 live rows) | Yes, if the charge rule below passes | Normal case. |
| `finished` | No | No | Would be inconsistent with finalize. Live count 0. |
| `attended` | Any | No | Unused. If it appears later, it means presence. |
| `cancelled` | Any | No | Credits were already returned when status was `booked`. |
| `waitlisted` | Any | No | No deduction. Live count 0. |
| `no_show` | Any | No | Unused, and current UI already treats it as voided. Do not overload it. |
| `not_attended` | Any | No second award | Return the existing replacement. |

Charge rule for v1, because live data is entirely one class type and one credit, while the engine allows more:

- Eligible when there is exactly one `booking_credit_charges` row, `credits_used = 1`, and `bookings.credits_used = 1`.
- Refuse mixed Reformer/Mat charges, multi-credit charges, missing charge rows, and unlimited source packages (`credits_remaining` null on the charged package). Those need a separate approved rule. See section 15.

The action is available to instructor, admin, and owner. Clients cannot call it. Enforce `private.is_staff()` inside the function.

### Transaction `public.mark_booking_not_attended(p_booking_id uuid)`

1. `SELECT … FOR UPDATE` the booking.
2. If status is already `not_attended`, return the existing replacement id. Do not insert.
3. Reject ineligible status or a session that has not ended.
4. Reject when a replacement row already exists for this booking (unique key).
5. Read the single charge. Do not update that `user_packages` row.
6. Insert one replacement owned package for the charge’s `class_type`.
7. Insert the audit event and the booking link in the same function.
8. Set booking status to `not_attended`. Leave `cancelled_at` null. Leave `recurring_materialization_log` status `succeeded` and `booking_id` unchanged.
9. On unique conflict, roll back and return the existing replacement.

Repeated clicks, retries, and two staff members serialize on the booking row lock. The unique key is the backstop if two transactions pass the read.

Ordinary cancellation cannot also refund this booking: `cancel_booking` rejects every status except `booked` and `waitlisted`.

A later booking that spends the replacement credit uses normal deduction. Cancelling that later booking refunds the replacement package only, through the existing cancel path. The original Not attended booking stays Not attended.

## 8. Replacement-Credit Architecture Options

### Option 1 — Dedicated catalog row plus a normal owned package (recommended)

Add two inactive catalog rows, one Reformer and one Mat:

- `package_type = 'drop_in'`
- `credits_included = 1`
- `price = 0`
- `is_active = false` so public pricing and the normal apply dropdown omit them
- `max_per_user` null, so more than one replacement can exist
- `validity_days` set only after the expiry decision

`book_session_core` does not require `packages.is_active`, so an inactive catalog row can still be spent. Client booking, staff manual booking, credit charges, cancellation, Account, and Manage Packages already understand `user_packages`.

Identify the row with:

- `user_packages.entitlement_kind = 'replacement'`
- `user_packages.source_booking_id` unique
- `payment_state = 'complimentary'`
- `agreed_price = 0`

Show the origin as “Replacement for [class] on [session date]”.

The original package is never updated, so its balance, expiry, and status stay as they were. Recurring rules are a different table and are not modified.

### Option 2 — Reuse the public Single Class catalog row

A normal “Reformer · Single Class” row costs €15 and expires in 30 days. Using it would look like a sold drop-in unless extra flags still exist. Those flags are the same columns as option 1, with more risk that the credit is confused with a paid single class. Weaker fit.

### Option 3 — A separate entitlement table

Booking, recurring pick, and Account would all need a second balance. That is a parallel credit system. The current engine cannot spend it. Reject.

### Consumption and cancellation

The replacement is spent by the existing deduction path once it is `active` and has 1 credit. When that credit is used, the existing trigger can set `used_up`. Cancelling the booking that spent it refunds this package if it is `active` or `used_up`, which is the correct single-package refund.

`pick_client_packages_for_session` will select it whenever it is the earliest-expiring eligible pack. Whether recurring materialization may do that is an open decision. The recommended default is to exclude `entitlement_kind = 'replacement'` from the automatic picker and still allow staff and clients to select it manually.

### Unresolved single-use versus multi-charge

The approved example is one Reformer credit. The schema allows a booking to charge N credits and two class types. Live data has neither. v1 should refuse those bookings rather than invent “one credit back” or “N new packages”.

Unlimited source packages are also refused in v1. Awarding a scarce credit when nothing scarce was consumed is a different product rule. Live unlimited count is 0.

Reversal is not in v1. A later reversal is only safe if the replacement credit is still unused, and only for owner/admin, in a transaction that cancels the replacement package and returns the booking to `finished`. The unique `source_booking_id` must then be partial (`where status <> 'voided'`) or reversal stays impossible. That index shape should be chosen now if reversal is likely.

## 9. Proposed UI/UX

Tone stays on the current warm palette: background `#f4f1e8`, foreground `#2d3a1f`, accent `#b8a678`. No new palette and no calendar library.

### Popup layout

Desktop: client dialog `max-w-3xl`, `max-h-[92vh]`, internal scroll. Day dialog stays open underneath.

Phone: full viewport, safe-area padding, sticky header with full name, phone, and a 44px Close. No horizontal page scroll. Groups stack as full-width rows.

Transitions: opacity 150ms. `motion-reduce:transition-none`.

Focus:

- Portal the client dialog separately.
- Set `inert` on the day dialog root, including its backdrop.
- Escape closes only the client dialog and returns focus to the booking card.
- Initial focus on Close, which is the least destructive control.
- Accordions follow the APG pattern: `h3` > `button` with `aria-expanded` and `aria-controls`. Manage Packages already uses `aria-expanded`.

Header: `profiles.full_name`, then `profiles.phone` when non-null, then Close. The month query already embeds phone. Pass it through `MonthCalendarSlotBooking` instead of compacting the name before the popup. Compact names stay on the calendar cards.

### Package groups

Reuse `partition_packages_by_lifecycle()`. Do not write a second lifecycle function.

| Group | Default | Row contents |
| --- | --- | --- |
| Active | Open | Name, class type, purchased date, credits or Unlimited, expiry, payment state, Record payment when allowed, replacement origin when `source_booking_id` is set. |
| Expired | Closed | Same, including payment actions. |
| Exhausted | Closed | Same. |
| Cancelled | Closed | Same. Outstanding payment remains visible. |

`expiring_soon` stays inside Active, with the existing “Expiring soon” label.

### Booking groups

These are UI groups. Map stored status as follows:

| Stored status | Group |
| --- | --- |
| `booked`, `waitlisted`, and session start in the future | Upcoming |
| `booked` and session already ended, `finished`, `attended` | Finished |
| `cancelled` | Cancelled |
| `no_show` | Needs a product decision. Until then, show it under Cancelled with the literal label “No show”, because the day roster already treats it as voided. Do not call it Not attended. Live count 0. |
| `not_attended` | Not attended |

Upcoming open. The other three closed. Each Not attended row shows “Replacement credit awarded” and the class type. Finished rows that pass the eligibility matrix show **Mark not attended** with a confirm that states the original package balance will stay unchanged.

History: page size 25 per group, ordered by session start descending, “Load earlier” until exhausted. Remove the 120 and 12 caps for this popup. The client-bookings manager can keep its own limit.

### Calendar outcome styling

Keep class type as the color and a text label (`Reformer`, `Mat`, `Private`, `Intro`). Encode outcome with text plus border, not a second fill that fights type color:

| Outcome | Card | Text |
| --- | --- | --- |
| Booked / upcoming | Current type fill | “Booked” |
| Finished | Same type fill at lower emphasis, solid border | “Finished” |
| Cancelled | Neutral surface, dashed border, type name as text | “Cancelled” |
| Not attended | Neutral surface, accent-colored outline, type name as text | “Not attended” |

`attended`, if it ever appears, uses the Finished treatment and the label “Attended”. `waitlisted` uses the Booked treatment and the label “Waitlisted”. `no_show` uses the Cancelled treatment and the label “No show”.

Day-detail lists include cancelled and Not attended. Month cell counts, hour counts, and the week strip keep counting only today’s active statuses: `booked`, `waitlisted`, `attended`, `finished`. They do not count `cancelled`, `no_show`, or `not_attended`. Live capacity stays `booked` only.

The week strip can remain active-only. The visibility requirement is the day-detail popup and the day roster, which already has a cancelled list.

## 10. Proposed Database Changes

Additive script `supabase/45_package_payments_and_not_attended.sql`. No update to the stale `lates_migrations_01-03.sql` bundle.

### Columns on `public.user_packages`

| Column | Type | Rule |
| --- | --- | --- |
| `payment_state` | `text not null default 'not_recorded'` | Check `not_recorded`, `unpaid`, `paid`, `waived`, `complimentary`. |
| `agreed_price` | `numeric(10,2)` | Null only for historical unknown. Check `>= 0`. Complimentary uses 0. |
| `payment_method` | `text` | Null unless `paid`. Check `cash` or `card_pos`. |
| `paid_at` | `timestamptz` | Server time of the latest successful recording. |
| `paid_by` | `uuid references profiles(id)` | Staff actor. |
| `entitlement_kind` | `text not null default 'standard'` | Check `standard` or `replacement`. |
| `source_booking_id` | `uuid references bookings(id) on delete restrict` | Required for replacement, null for standard. |

Checks:

- `paid` requires method, `paid_at`, `paid_by`, and `agreed_price`.
- `complimentary` requires `agreed_price = 0` and null method.
- `replacement` requires `source_booking_id` and `payment_state = 'complimentary'`.
- Unique `source_booking_id`.

`BEFORE INSERT` trigger, only when `agreed_price` is null and kind is `standard`: copy `packages.price`. Existing rows are not backfilled.

Amend `handle_user_package_status()` so it does not change `cancelled`, and so it does not turn `expired` into `used_up`. Payment updates must not move lifecycle. This is a small behavior fix required before those updates exist.

### `public.user_package_payment_events`

Append-only. Separate from lifecycle events so a package delete cannot be mistaken for deleting a payment, and so the lifecycle action check stays intact.

| Column | Type |
| --- | --- |
| `id` | `uuid pk` |
| `user_package_id` | `uuid not null` initially, `on delete restrict` while the package exists. If the package is hard-deleted, the application already blocks that when bookings exist. For a package with no bookings, deletion must be rejected when any payment event exists, or the event’s `user_package_id` must use `on delete set null` plus a `package_snapshot jsonb`. Recommended: `on delete restrict` from payment events, and change Remove to refuse when payment events exist. Staff deactivate instead. |
| `user_id` | `uuid not null` |
| `actor_user_id` | `uuid not null` |
| `action` | `payment_recorded`, `marked_unpaid`, `payment_method_corrected`, `payment_voided`, `charge_waived` |
| `method` | `cash` or `card_pos` or null |
| `amount` | `numeric(10,2)` |
| `previous_state` / `new_state` | text |
| `reason` | text |
| `created_at` | `timestamptz default now()` |

Index `(user_package_id, created_at desc)` and `(new_state, created_at desc)`.

No update or delete grants for `authenticated`. Inserts happen only inside security-definer functions.

### Booking status

Extend `bookings_status_check` with `not_attended`.

Unique index:

```text
booking_replacement_source_uq
on user_packages (source_booking_id)
where source_booking_id is not null
```

### Functions

- `public.record_package_payment(p_user_package_id, p_method, p_confirmed_amount)`
- `public.mark_package_unpaid(p_user_package_id)`
- `public.waive_package_charge(p_user_package_id, p_reason)` — `private.is_admin()` if that recommendation is accepted
- `public.correct_package_payment(p_user_package_id, p_action, p_method, p_reason)` — admin
- `public.mark_booking_not_attended(p_booking_id)` — `private.is_staff()`, one transaction
- Optional later: exclude replacements inside `private.pick_client_packages_for_session`

`finalize_past_bookings` needs no change if Not attended is not `booked`.

`cancel_booking` needs no credit change. It already rejects non-open statuses.

### RLS

Staff select on payment events through `private.is_staff()`. Clients select their own package’s payment state via existing `user_packages` select policy, so Account can show “Paid”, “Payment not recorded”, “Unpaid”, “Waived”, or “Replacement credit”. Clients do not select the staff actor id; expose a client-safe view or omit `paid_by` from the client query.

### Historical migration

```text
update user_packages
   set payment_state = 'not_recorded'
 where payment_state is null;
```

The default covers rows that already exist when the column is added. Do not set `paid`. Do not copy catalog price into `agreed_price` for old rows. Leave `payment_ref` unused.

### Catalog seed

Two inactive zero-price drop-in rows: “Reformer replacement credit” and “Mat replacement credit”. Fixed UUIDs, `ON CONFLICT DO NOTHING`.

## 11. Data-Layer and Application Changes

| File | Change |
| --- | --- |
| `supabase/45_package_payments_and_not_attended.sql` | New. Columns, events, status, functions, RLS, catalog rows, trigger guard. |
| `supabase/README.md` | Add step 38 pointing at script 45. |
| `src/app/(marketing)/staff/membership/actions.ts` | Call the payment RPCs. Extend `UserMembership` with payment fields, `purchased_at` display data, entitlement, source booking label. Keep lifecycle writes as they are. |
| `src/app/(marketing)/staff/membership/membership-panel.tsx` | Payment line, record/waive controls, purchased date, optional pay-on-apply. |
| `src/lib/packages/lifecycle.ts` | No second grouping model. Add payment label helpers beside it, or a sibling `src/lib/packages/payment-state.ts`. |
| `src/lib/packages/lifecycle.test.ts` | Keep lifecycle tests. Add payment helper tests in a new file. |
| `src/features/bookings/staff-bookings.ts` | Add `not_attended` to `BOOKING_STATUSES` and labels. |
| `src/features/bookings/day-bookings.ts` | Active count stays unchanged. Add a visible non-count bucket for `not_attended`. Keep `cancelled` and `no_show` out of active counts. |
| `src/features/bookings/month-calendar.ts` | Carry status, full name, and phone. Stop dropping inactive statuses. Count only active statuses. |
| `src/features/bookings/staff-booking-queries.ts` | Month select already has phone. Day-detail mapping must keep it. |
| `src/app/(marketing)/staff/day-bookings/month-calendar-section.tsx` | Larger dialog, full name, phone, package groups, booking groups, Not attended action, payment action. |
| `src/app/(marketing)/staff/day-bookings/actions.ts` | No status filter change required for the query. Revalidate path `/staff/day-bookings` after mutations. |
| `src/features/client-booking-manager/actions.ts` | New staff loader for all packages and paged bookings, or extend the dashboard with an explicit popup query. Do not keep using `get_active_packages` for this popup. |
| `src/features/client-booking-manager/booking-filters.ts` | Add group mapping that matches section 9. Leave the client-bookings manager filters intact or update them in the same change so “finished” does not swallow `not_attended`. |
| `src/app/(marketing)/staff/bookings/actions.ts` | History filter “finished” must not include `not_attended`. Add a Not attended filter or include it under a named option. |
| `src/app/(marketing)/account/page.tsx` and `account-content.tsx` | Show replacement origin and a simple payment label. Clients do not get the action buttons. |
| `src/features/bookings/session-availability.ts` | Leave `LIVE_CAPACITY_STATUSES` as `booked`. Do not add `not_attended` to occupancy. |

New UI pieces can live next to the popup: `client-detail-dialog.tsx`, `package-payment-actions.tsx`. Shared payment calls belong in one server module imported by Manage Packages and Day Bookings.

`record_package_event` stays for lifecycle. Payment functions write `user_package_payment_events` inside SQL so the audit cannot be skipped.

## 12. Statistics Definitions

Four figures, on Manage Packages. Each can be scoped to the selected client or to the studio. Each is a record of what staff entered, not a POS reconciliation.

1. **Recorded payments**
   - Sum of `amount` and count of events where `action = 'payment_recorded'` and the package’s current state is still `paid` or a later method correction kept it `paid`.
   - Date basis: event `created_at`.
   - Excludes `not_recorded`, `unpaid`, `waived`, `complimentary`, and voided payments.
   - Historical unknowns stay out until someone records them.

2. **Outstanding**
   - Sum of `agreed_price` and count of owned packages whose current `payment_state = 'unpaid'`.
   - Date basis: current state, not purchase month. A secondary “marked unpaid this month” count can use the `marked_unpaid` event date.
   - Includes cancelled packages that are still `unpaid`.
   - Excludes `not_recorded` (unknown, not debt), `waived`, `paid`, and `complimentary`.
   - Rows with null `agreed_price` count as outstanding items and are omitted from the money sum, with a separate “amount not set” count.

3. **Payment not recorded**
   - Count of owned packages with `payment_state = 'not_recorded'`.
   - No money sum. The amount is unknown.
   - This is the backlog of the 81 current packages plus any new package left unclassified.

4. **Waived charges**
   - Sum of `amount` and count of `charge_waived` events.
   - Date basis: waiver event `created_at`.
   - Excludes complimentary replacement credits, which are not charges that were forgiven.

Complimentary replacement count can wait. It is an operational count, not revenue.

## 13. Test and Verification Plan

Do not implement these until the open decisions are approved.

### Unit

- `src/lib/packages/lifecycle.test.ts` — grouping unchanged when payment fields are present.
- New `src/lib/packages/payment-state.test.ts` — allowed actions per state.
- `src/features/bookings/day-bookings.test.ts` — `not_attended` excluded from active, included in a visible bucket.
- `src/features/bookings/month-calendar.test.ts` — cancelled and `not_attended` render in day slots and stay out of `total_active`.
- `src/features/bookings/staff-bookings.test.ts` — label “Not attended”.
- `src/features/client-booking-manager/booking-filters.test.ts` — group map for every stored status.
- `src/app/(marketing)/staff/bookings/actions.test.ts` — finished filter does not include `not_attended`.
- `src/features/bookings/session-availability.test.ts` — capacity statuses unchanged.

### Component

- `membership-panel.test.tsx` — payment state, purchased date, record payment, inactive packages selectable, complimentary row has no Record payment.
- `month-calendar-section.test.tsx` — full name, phone hidden when null, groups default open/closed, Not attended button only for eligible rows, close returns focus, `not_attended` copy.

### SQL

Extend the style of `supabase/tests/booking_core_regression.sql` with a new read-and-rollback script:

- Record payment once; second call does not duplicate.
- Instructor void/waive rejected if admin-only is approved.
- Waiver leaves credits and status unchanged.
- Cancelled unpaid stays outstanding until waiver.
- Not attended on `finished` and on past `booked`.
- Reject future `booked`, `cancelled`, `waitlisted`.
- Original `credits_remaining` unchanged.
- Second call and a simulated concurrent unique violation return one replacement.
- Replacement booking can be cancelled and refunds only the replacement package.
- Recurring log remains `succeeded` with the same `booking_id`.
- `finalize_past_bookings` does not change `not_attended`.
- Mixed-charge and `credits_used > 1` rejected.
- Unlimited source rejected.
- Trigger update of `payment_state` does not flip `cancelled` or `expired`.
- Hard delete of a package with a payment event fails.
- Existing 81-row migration shape: add column in a transaction and confirm default `not_recorded` without updating balances. Run against a transaction that rolls back, not against live data.

### E2E

`e2e/booking-flow.spec.ts` and `e2e/fixtures/supabase.ts` cover client booking status. Add an authenticated staff spec only if the Playwright staff fixture already exists; otherwise keep SQL plus component tests and say browser E2E is blocked on staff credentials. Desktop and a 390px viewport: open month day, open client, record payment, mark not attended, close back to the same day.

### Regression checks after implementation

`npm run lint`, `npm run typecheck`, `npm run test`, and the new SQL script. `npm run test:e2e` for the booking smoke if credentials are present. Production build if the dialog change is substantial.

## 14. Migration, Deployment, and Rollback Plan

Order:

1. Approve the open decisions in section 15.
2. Apply script 45 in the Supabase SQL editor as `postgres`. It is additive and re-runnable.
3. Confirm defaults: existing packages `not_recorded`, `agreed_price` null, booking statuses unchanged, balances unchanged.
4. Deploy the app that calls the new RPCs.
5. Staff start recording new payments. Historical rows stay unknown until a person records them.

Compatibility:

- Old app, new database: current inserts set `payment_state` by default and can snapshot `agreed_price` through the insert trigger. Current booking updates still work. New status is unused until the new app writes it. Safe.
- New app, old database: the RPCs 404 and the new status check fails. Deploy the database first. The UI should surface the RPC error and not write a partial payment.
- `finalize_past_bookings` and `cancel_booking` keep their current meanings.

Rollback limitations:

- Reverting the app leaves the new columns unused. Existing behavior continues.
- Do not drop payment events, replacement packages, or `not_attended` rows to roll back.
- A down script may remain unapplied. If it is ever required, it may drop unused columns only while no `payment_recorded`, `charge_waived`, or `not_attended` rows exist. After those rows exist, rollback is operational (stop using the buttons), not destructive.
- Catalog replacement rows can stay inactive if the feature is paused.

Do not run this script as part of the discovery task. It is not applied.

## 15. Open Questions and Recommended Answers

1. **Who may waive, void, or correct a payment?**
   - Matters because recording is approved for instructors, and erasure is not.
   - Options: all staff; owner+admin; owner only.
   - Recommendation: owner and admin (`private.is_admin()`). Instructors record the first payment and may mark `not_recorded` as `unpaid`.

2. **Replacement expiry**
   - Matters for `pick_client_packages_for_session`, which spends the soonest expiry first.
   - Options: no expiry; 30 days like a single class; a studio-chosen number of days.
   - Recommendation: 30 days from issuance, stored in `expires_at`, so the credit is used before a longer pack and does not live forever. This is a recommendation, not an approved rule.

3. **Start date and immediate use**
   - Recommendation: `starts_at = now()`, status `active`, usable immediately by staff manual booking and client booking.

4. **Recurring materialization**
   - Options: allow the picker to spend it; exclude replacements from the automatic picker.
   - Recommendation: exclude them from `pick_client_packages_for_session` when the caller is recurring materialization, and allow manual selection. Otherwise a weekly rule can silently consume a makeup credit.

5. **Where replacement credits appear**
   - Recommendation: Manage Packages, the client popup, and Account, in the normal lifecycle group, with the origin line and payment label “Replacement credit”.

6. **Payment label for a replacement**
   - Recommendation: `complimentary`, displayed as “Replacement credit”, omitted from outstanding and from recorded payments.

7. **Multi-credit and mixed-class bookings**
   - Recommendation: refuse in v1 and show why. Live counts are zero. Approve a later rule if a private or mixed card starts charging more than one credit.

8. **Unlimited packages**
   - Recommendation: refuse Not attended when the consumed package has null `credits_remaining`. Nothing scarce was taken.

9. **Reversal of Not attended**
   - Recommendation: not in the first release. If added later, owner/admin only, and only while the replacement credit is unused.

10. **Age limit for historical bookings**
    - 81 `finished` rows are eligible if no window is set.
    - Options: any ended booking; a fixed day window; owner-only after N days.
    - Recommendation: any ended eligible booking, with a confirm that names the session date. No silent bulk action.

11. **`no_show` display if it appears later**
    - Recommendation: keep the stored value, show “No show” in the Cancelled visual group, and do not issue a replacement for it.

12. **Historical amount when recording an old package**
    - Recommendation: staff confirm the current catalog price as the full amount. Store that confirmation as `agreed_price`. Do not pretend it is the original till amount.

## 16. Implementation Checklist After Approval

1. Lock section 15 answers, especially waiver permission, 30-day expiry, recurring exclusion, and the v1 refusal of multi-credit, mixed, and unlimited cases.
2. Write and review script 45. Apply it only after approval. Verify defaults and that balances did not change.
3. Add payment helpers and tests.
4. Add the three payment RPCs and wire Manage Packages, including pay-on-apply and purchased date.
5. Add `mark_booking_not_attended` and the replacement catalog rows. Test the transaction, unique key, unchanged original balance, and recurring log.
6. Extend booking status types, calendar mapping, counts, and history filters.
7. Rebuild the client popup groups, phone header, payment actions, and Not attended action on the same RPCs. Fix nested dialog inert/focus.
8. Show the same package groups and a read-only payment/replacement label on Account.
9. Run lint, typecheck, unit tests, SQL rollback tests, and desktop plus 390px browser checks of Manage Packages and Day Bookings.
10. Deploy database, then app. Leave historical packages as Payment not recorded.

Acceptance:

- Existing packages stay bookable and stay `not_recorded` until a person acts.
- Recording payment does not change credits, expiry, or lifecycle.
- Cancel does not waive. Waiver is explicit and audited.
- One Not attended action creates one replacement credit and does not increase the original package.
- Retries and concurrent calls do not create a second credit.
- Cancelled and Not attended rows are visible in day details and absent from active counts and from capacity.
- Manage Packages and the client popup call the same functions.

## Purpose

Document current package, payment, booking, and calendar behavior and propose an implementation that matches the approved rules.

## Inputs / context used

Repository docs, numbered SQL through script 44, staff membership and day-booking UI, and read-only aggregates from the connected Supabase project.

## Actions performed

Read-only code and database inspection. No schema, data, or application changes except this log.

## Files changed or inspected

This log is the only file written. Inspection covered `supabase/01_schema.sql`, `02_rls.sql`, `21_cancel_booking_staff_auth.sql`, `22_recurring_prebook_functions.sql`, `38_finalize_past_bookings.sql`, `39_package_lifecycle_alignment.sql`, `40_recurring_materialize_failure_visibility.sql`, `41_staff_manual_uncapped_recurring_first_occurrence.sql`, `44_saturday_hours_1200.sql`, membership actions and panel, day-booking actions, month calendar, and client dashboard loader.

## Commands run

Read-only PostgREST counts and `get_default_studio_hours` for Saturday 2026-10-10. Git branch and HEAD. No migrations.

## Result

Discovery report above. Implementation is blocked on the decisions in section 15.

## Verification

Live column lists, status counts, and Saturday hours were read from the connected database. Function source text was verified from the repository, not by dumping live `pg_proc`.

## Blockers / risks

Waiver permission, replacement expiry, recurring consumption, multi-credit policy, and reversal are unresolved. Payment and attendance must be one transaction. The status trigger can rewrite lifecycle on an unrelated update.

## Next recommended action

Review section 15 and approve or replace the recommendations before any schema or UI implementation.
