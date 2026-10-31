# Staff Guest Bookings — Discovery and Implementation Design Report

- date: 2026-10-31
- actor: cursor
- category: planning
- topic: staff-guest-bookings
- branch: master
- commit: afd272532995e47132eb2d91342faf45941abb1a
- related plan: this report
- related prompt: staff-managed guest bookings discovery (no implementation)
- status: discovery complete; ready for review before implementation

## 1. Executive Summary

Staff-managed guest bookings are feasible. The recommended design is **Option A**: one normal `public.bookings` row per guest, with explicit guest identity columns, no profile, and no package.

Live capacity is already a shared count. `private.book_session_core` locks the session row and counts `bookings` where `status = 'booked'`. A guest row with that status occupies one place with registered clients. A separate guest table would overbook if any writer or reader missed the union.

Today every booking requires a registered user and an owned package. Live production has **824** booking rows; all have a user, a package, and `credits_used >= 1`. Guest rows need those two foreign keys to become nullable, with a check constraint that keeps every registered-client row under the old rules.

Main risks:

1. Staff calendars use `profiles!bookings_user_id_fkey!inner` and drop rows with no profile. Guests would take seats and disappear until readers change.
2. `public.cancel_booking` refunds `credits_used` onto `user_package_id` when no charge row exists. Guests must skip that branch.
3. `public.mark_booking_not_attended` issues replacement credits after a credit charge. Guests must never call it; reject them explicitly.
4. Creating guest rows before calendar readers understand them hides occupied places from staff. Gate creation off until the reader release ships.
5. Reverting the app does not remove guest rows. Older readers hide them; capacity still counts them.

## 2. Scope and Evidence

### Repository baseline

| Item | Value |
| --- | --- |
| Branch | `master` |
| Commit | `afd2725` — *Show cancelled session cards and yellow not-attended on the month calendar.* |
| Working tree | Unrelated local noise only: UI-skill bytecode caches, untracked recurring-credit review log, `next-env.d.ts`, `tsconfig.tsbuildinfo`. This discovery did not change them. |
| Conventions read | `AGENTS.md`, `docs/general/architecture.md`, `docs/general/testing-strategy.md`, `docs/general/logging-strategy.md`, `docs/general/supabase-setup.md`, `docs/general/ui-architecture.md`, `docs/general/responsive-strategy.md`, `docs/general/engineering-principles.md`, `supabase/config.toml` |
| Migration convention | Numbered SQL scripts `supabase/01_schema.sql` … `supabase/47_materialize_selection_credit_aware.sql`. Later `create or replace` wins. Next guest script: `supabase/48_staff_guest_bookings.sql`. |
| Not the live schema | `supabase/migrations/lates_migrations_01-03.sql` is an older snapshot. Do not add guest DDL there. |
| API schemas | `supabase/config.toml` exposes `public` and `storage` only. `private` is not in the Data API. |

### Database environment inspected

| Item | Value |
| --- | --- |
| Project | `xzlirjwzpmvugkbhtzxw` (Nektarios-I's Project) |
| Region | `eu-west-1` |
| Postgres | 17.6 |
| Access mode | Read-only `execute_sql` only. No mutations, no booking/cancel RPCs, no migration apply. |

Live catalog matches scripts 41, 45, and 46 for bookings:

- Columns include `booking_source`, `created_by_user_id`, `recurring_materialization_log_id`, `cancelled_by_user_id`, `cancellation_actor_note`.
- Status check includes `not_attended`.
- `private.book_session_core` comment matches script 41 (staff-manual recurring-priority gate; capacity counts `status = 'booked'`).
- `private.feature_gates.not_attended_replacement = true`.

**Known code/database difference:** `supabase/45_not_attended_replacement.sql` lines 81–83 insert that gate as `false`. Production has enabled it. Guest work must not reset it.

### Live booking population (aggregates only)

| booking_source | booked | finished | cancelled | not_attended |
| --- | ---: | ---: | ---: | ---: |
| client | 0 | 17 | 6 | 1 |
| staff_manual | 154 | 150 | 75 | 5 |
| recurring | 90 | 192 | 131 | 3 |

- Total **824**. Null user / null package / zero credits: **0**.
- No live rows use `waitlisted`, `attended`, or `no_show`.
- Duplicate scheduled `(starts_at, ends_at, session_type)` groups: **0**. There is still no unique index, so `ensure_session_slot` retains a theoretical race.

### Verification limits

| Kind | Status |
| --- | --- |
| Verified repository + live catalog | Columns, checks, FKs, indexes, triggers, RLS, grants, function signatures, capacity predicate, booking aggregates |
| Verified repository only | UI composition, count formulas, profile-embed usage (deployed from this commit) |
| Not executed | Concurrent booking load, mutation RPCs; behavior taken from function bodies matching live signatures |
| Privacy | No credentials, client names, notes, emails, or booking ids in this report |

## 3. Current Booking Architecture

### 3.1 Tables and constraints (`public.bookings`)

Defined in `supabase/01_schema.sql` lines 257–272; extended by scripts 18, 45, 46. Live columns:

| Column | Nullable | Constraint / FK |
| --- | --- | --- |
| `id` | no | PK, `gen_random_uuid()` |
| `user_id` | **no** | → `profiles(id)` **ON DELETE CASCADE** |
| `session_id` | no | → `sessions(id)` **ON DELETE RESTRICT** |
| `user_package_id` | **no** | → `user_packages(id)` **ON DELETE RESTRICT** |
| `status` | no | `booked\|waitlisted\|cancelled\|attended\|no_show\|finished\|not_attended` |
| `credits_used` | no | default 1; no positive check; live min = 1 |
| `booked_at` / `created_at` / `updated_at` | no | `set_bookings_updated_at` trigger |
| `cancelled_at` / `cancellation_reason` | yes | |
| `booking_source` | no | `client\|staff_manual\|recurring` (default `client`) |
| `created_by_user_id` | yes | → `profiles` ON DELETE SET NULL |
| `recurring_materialization_log_id` | yes | → materialization log ON DELETE SET NULL |
| `cancelled_by_user_id` | yes | → `profiles` ON DELETE SET NULL |
| `cancellation_actor_note` | yes | known historical backfill strings only |

Indexes (live): `bookings_one_active_per_session` unique on `(user_id, session_id)` where status in (`booked`,`waitlisted`); plus indexes on `user_id`, `session_id`, `status`, `user_package_id`, `booking_source`, cancelled-by, materialization log.

Triggers: only `set_bookings_updated_at`.

Related:

- `booking_credit_charges` (`01_schema.sql` 291–299): requires package + positive credits; unique `(booking_id, class_type)`; cascades on booking delete.
- `user_packages.user_id` / `package_id` not null (`01_schema.sql` 173–176).
- `booking_outcome_events` (`45_not_attended_replacement.sql` 61–71): `action = 'not_attended'` only.
- `user_package_events` (`39_package_lifecycle_alignment.sql`): membership audit, not booking provenance.
- Recurring link: `bookings.recurring_materialization_log_id` + `booking_source = 'recurring'`.

**Does every booking require a registered user?** Yes — `user_id NOT NULL` + FK.  
**Owned package?** Yes — `user_package_id NOT NULL` + FK.  
**Credit charge?** Practically yes for successful `booked` paths: `book_session_core` inserts charges when credits are deducted (`41_...sql` 265–283). Waitlisted path does not charge. Live booked/finished/not_attended paths all used packages with `credits_used >= 1`.

Making columns nullable without a shape check would let registered bookings lose their package. See §7 for `bookings_attendee_shape`.

### 3.2 Role helpers and RLS

`private.is_staff` = owner | admin | instructor (`02_rls.sql` 56–68).  
`private.is_admin` = owner | admin.  
App match: `TEACHING_STAFF_ROLES` in `src/features/client-booking-manager/staff-access.ts` 1–7.

`private.assert_staff_may_book_for_client` (`20_staff_booking_rpc.sql` 15–40): staff + target role `client` (`P0017`). **Guest booking must not call this.**

Live `bookings` RLS (enabled):

| Policy | Cmd | Rule |
| --- | --- | --- |
| client reads own | select | `auth.uid() = user_id` |
| staff reads all | select | `is_staff()` |
| admin reads all | select | `is_admin()` |
| client can book | insert | `auth.uid() = user_id` |
| client cancels own | update | own row |
| admin manages | all | `is_admin()` |

Instructors can **read** all bookings; they cannot table-update except via security-definer RPCs (`cancel_booking`, `mark_booking_not_attended`). Guest create/edit/cancel must follow that RPC pattern.

`sessions: public views scheduled` allows anon + authenticated to read scheduled session metadata (no booking names). Client credit-charge reads are scoped to own `user_id`.

### 3.3 Capacity, locking, duplicates

**Shared capacity (all paths):** `private.book_session_core` (`41_...sql` 78–95, 204–217):

1. `SELECT * FROM sessions WHERE id = … FOR UPDATE`
2. Require `scheduled`; reject `starts_at <= now()` (`P0004`)
3. For sources `client` and `staff_manual`: `recurring_blocks_public_booking` (`P0032`)
4. Count `bookings` with `status = 'booked'` only
5. If `count >= capacity` → `P0015` (waitlist flag is false on all live wrappers)

| Path | Wrapper | Horizon | Source |
| --- | --- | --- | --- |
| Client | `book_session` / `book_session_with_credits` (script 27) | 14-day public | `client` |
| Staff manual | `staff_book_session_*` (script 41) | none upper; past blocked | `staff_manual` |
| Recurring | `materialize_recurring_occurrence` (script 41 ~971) | n/a | `recurring` |

App documentation of the same rules: `src/features/bookings/session-availability.ts` 13–20 (`LIVE_CAPACITY_STATUSES = ['booked']`; occupancy display also includes finished/attended).

**Duplicate client prevention — both:**

- Constraint: `bookings_one_active_per_session`
- Query: `private.user_has_active_booking_at_slot` (`02_rls.sql` 86–107) → `P0013` in core

Null `user_id` values are distinct in unique indexes, so multiple guests on one session do not collide with each other or with a registered client. Guest **names** must not participate in uniqueness.

**Session creation:** `ensure_session_slot` / `ensure_session_slot_at` (`12_studio_schedule.sql` 117–173). No slot unique index. Guest path should reuse this, then lock the returned session id.

**Staff date window:** `is_within_staff_manual_booking_window` (`staff-manual-booking-window.ts` 8–16) = today and future studio dates. Server still enforces `P0004` for started sessions.

Advisory remaining places: `get_slots_for_day` (`schedule-actions.ts` 164–173) counts `status = 'booked'` without a profile join.

### 3.4 Cancellation

`public.cancel_booking` (`46_cancellation_actor.sql` 40–193):

- Auth via `auth.uid()`; staff may cancel others; clients own-only + 4-hour cutoff (`P0029`)
- Only `booked` / `waitlisted` (`P0012` on repeat)
- Refund via `booking_credit_charges` if present; else add `credits_used` to `user_package_id` (118–130) — **dangerous for guests unless skipped**
- Recurring skip only when `booking_source = 'recurring'` or materialization log set (142–144)

### 3.5 Completion and Not attended

`finalize_past_bookings` (`38_finalize_past_bookings.sql` 44–50): `booked` → `finished` when `sessions.ends_at < now()`. Hourly cron. Package-agnostic. **Guests follow this automatically.**

`mark_booking_not_attended` (`45_...sql` 247–404): staff + gate + ended session + status booked/finished + exactly one charge + `credits_used = 1` → issues replacement `user_packages` for `bookings.user_id`, writes `booking_outcome_events`, sets `not_attended`.  
UI gate: `evaluate_not_attended_eligibility` (`not-attended.ts` 17–45).  
**Guests must not use this path.**

### 3.6 Count semantics already in the product (do not invent)

| Meaning | Statuses | Code |
| --- | --- | --- |
| Live capacity | `booked` only | `book_session_core`; `LIVE_CAPACITY_STATUSES` |
| Display active | `booked`, `waitlisted`, `attended`, `finished` | `ACTIVE_BOOKING_STATUSES` in `day-bookings.ts` 9 |
| Occupancy ratio on day roster | `booked`, `finished`, `attended` | `OCCUPANCY_STATUSES` |
| Cancelled summary | `status = 'cancelled'` | `build_cancelled_groups` / `CancelledSessionCard` |
| Not attended / no_show | visible on month; excluded from display active | `month-calendar.ts` 248–251 |

## 4. Architecture Options and Recommendation

### Option A — Guest fields on `bookings` (**recommended**)

Add `attendee_kind`, `guest_label`, `guest_note`, `guest_request_id`, `guest_ordinal`; extend `booking_source` with `staff_guest`. Nullable `user_id` / `user_package_id` only for guest rows, enforced by `bookings_attendee_shape`.

**Valid registered-client row:** `attendee_kind = 'client'`; `user_id` and `user_package_id` NOT NULL; guest fields null; `credits_used >= 1`; source in `client|staff_manual|recurring`.

**Valid guest row:** `attendee_kind = 'guest'`; both FKs NULL; label 1–80; note null/1–500; `credits_used = 0`; source `staff_guest`; `created_by_user_id` NOT NULL; no materialization log; request id + ordinal NOT NULL.

**Why safer for this repo:** capacity is already `COUNT(*)` on `bookings`; the session `FOR UPDATE` lock already serializes client/staff/recurring; finalize and cancel already mutate by booking id; calendars already select bookings (need left join + label, not a second union).

### Option B — `guest_attendees` child table

Identity stays booking-specific (good). Still requires nullable parent `user_id`/`user_package_id`. Adds a join on every roster/calendar/history read and a second write per insert. Overkill for label + note. Not preferred for first release.

### Option C — Separate `guest_bookings` table

Capacity, locks, calendars, cancel, and finalize stay correct **only if every path unions both tables**. A missed union under-counts seats → overbook. Missed Option A readers hide guests who still occupy seats (safer failure). Option C is the comparison that should not be built here.

**Rejected:** shared Guest auth users, Guest1–N pools, infinite-credit packages — collide with unique index, assert-client checks, Account UI, and credit refunds.

## 5. Proposed Staff Workflow

### Entry

`ClientBookingManagerPanel` (`client-booking-manager-panel.tsx` 147–165): add **Guest booking** beside/under `ClientSelector`. Works with no client selected. Does not call `handle_client_select`. Does not mount `ManualBookingTab` (which requires packages, lines 35–40).

### Dialog flow

1. Reuse `SlotBookingPicker` with `booking_mode="staff_manual"` (staff window + `list_staff_open_slot_starts_for_day`).
2. First confirm stores `{ session_card, date_key, slot }` only — **no** `staff_manual_book_slot`.
3. Show `Reformer · Saturday · 09:00–10:00` + advisory remaining places from `build_session_availability`.
4. Attendee rows: start with 1; add/remove; cannot exceed advisory `spots_left`; label required; note optional.
5. Submit with client-generated request UUID (reuse on retry of same attempt). Reload slot before submit; if places dropped, block until staff remove rows.
6. Pending / success / error feedback; `role="alert"` on errors (`P0015`, `P0032`, `P0004`, gate off).

### Edit / cancel

Guest card opens a **guest detail dialog** (not `ClientDayPopup`, which loads `load_client_dashboard(booking.user_id)` at lines 87–116 and shows memberships/history). Preserve day-dialog `inert` + Escape stacking (`month-calendar-section.tsx` 379–400, `ClientDayPopup` `z-[60]`). Actions: edit label/note; cancel via existing staff confirm → `cancel_booking` while status is `booked`.

## 6. Calendar and Guest Counts

### Formulas

For a scope (day / hour / session / week slot):

- `active_total` = bookings in `ACTIVE_BOOKING_STATUSES` (**includes guests once**)
- `guest_count` = subset of `active_total` with `attendee_kind = 'guest'`
- `cancelled_total` = `status = 'cancelled'` (cancelled guests included here, **not** in `guest_count`)
- Never add `guest_count` into `active_total`

Live places available = capacity − count(`booked`) only.

Finished guests (post-`finalize_past_bookings`) remain in display-active and guest subset; they do **not** consume live capacity.

### Surfaces

| Surface | Current pattern | Guest presentation |
| --- | --- | --- |
| Month day cell | `format_type_counts_label` / compact `2R 1M` (`month-calendar.ts` 158–174); cancelled **not** on cell | `2 Reformer, 1 Mat · 2 guests` / `2R 1M · 2G`; omit when 0 |
| Hour row | type counts + ` · N cancelled` (`month-calendar-section.tsx` 298–302) | `2 Reformer, 1 Mat · 2 guests · 1 cancelled`; individual guest cards (do **not** collapse like Cancelled) |
| Cancelled card | one card per session, `N cancelled` (`CancelledSessionCard` 138–164) | cancelled guests stay inside; prefix list name `Guest · ` |
| Day roster pills | `active` / `cancelled` (`day-bookings-panel.tsx` 303–311) | add `guests` pill as subset |
| Day session header | occupancy `OCCUPANCY_STATUSES` + “N bookings” total | occupancy includes booked/finished/attended guests; add `N active · M guests` when M > 0 |
| Week overview | “session” = one active booking (`week-day-bookings.ts` 160–198); no cancelled count | keep count including guests; append ` · 2 guests` when > 0 |

Example: 2 registered booked + 2 booked guests + 1 cancelled guest → active 4, guests 2, cancelled 1, live seats used 4.

## 7. Proposed Database Changes

### Additive migration `supabase/48_staff_guest_bookings.sql`

**Columns on `bookings`:**

```text
attendee_kind text not null default 'client'
  check (attendee_kind in ('client','guest'))
guest_label text
guest_note text
guest_request_id uuid
guest_ordinal smallint
```

- Extend `bookings_booking_source_check` with `staff_guest`
- Drop NOT NULL on `user_id`, `user_package_id`
- Add `bookings_attendee_shape` (client vs guest rules in §4)
- Unique `(guest_request_id, guest_ordinal)` where guest
- Do not change FK delete behaviors

**`public.guest_booking_requests`:** `id` (client UUID PK), `actor_user_id`, `session_id`, `payload_hash`, `created_at`.  
**`public.booking_guest_detail_events`:** booking_id, actor, prior/new label/note, occurred_at. Do not reuse `booking_outcome_events`.

**Feature gate:** `private.feature_gates` key `staff_guest_bookings` default `false`.

**Validation lengths:** label 1–80; note 0–500; plain text (no existing note maxLength convention; these match short roster labels + booking notes).

### RPCs

| Function | Role |
| --- | --- |
| `public.staff_book_guests(...)` | Staff-only transactional batch create + idempotency |
| `public.staff_update_guest_booking(...)` | Staff edit label/note + audit event |
| Extend `public.cancel_booking` | Skip refund for `attendee_kind = 'guest'`; no recurring skip |
| Extend `public.mark_booking_not_attended` | Early reject guests (`P0043`) before charge checks |

`staff_book_guests` steps (single transaction):

1. Authorize `auth.uid()` + `is_staff()`; gate on
2. Idempotency: same request id + same payload hash → return existing ids; same id + different payload → `P0041`
3. Validate card/date/window/closed day; `ensure_session_slot_at`
4. `SELECT … FOR UPDATE` on session; scheduled; `P0004`; recurring gate like staff_manual (`P0032`)
5. Validate guests JSON; recheck `booked` count + batch size vs capacity (`P0015`)
6. Insert request row + one booking per guest (`credits_used = 0`, no charges, no package updates)
7. Return booking ids + remaining places

Prefer extracting shared session-open checks into `private.assert_staff_session_open` so guests and `book_session_core` cannot drift; otherwise duplicate predicates + SQL regression.

**Idempotency:** request UUID uniqueness via `guest_booking_requests.id`. Payload hash = card + date + start/end + ordered normalized labels/notes. Same names + new request id = new group. Names are not uniqueness keys.

**Optional companion:** unique index on scheduled session slots after confirming zero duplicates (currently 0).

### RLS / grants

- New RPCs: `REVOKE ALL FROM PUBLIC`; `GRANT EXECUTE TO authenticated` only; body still checks staff. No anon.
- New tables: RLS on; staff SELECT only; writes via security definer.
- Clients never match `auth.uid() = user_id` on null guest rows.
- Do not use service-role for guest booking paths.

## 8. Existing Code Impact Inventory

| Path | Symbol / lines | Current behavior | Proposed change | Risk if missed |
| --- | --- | --- | --- | --- |
| `supabase/48_staff_guest_bookings.sql` | new | n/a | Columns, checks, RPCs, gate | Feature cannot ship safely |
| `41_…sql` `book_session_core` | 78–217 | Capacity for credited bookings | Do not accept guest source; optional shared helper | Drifted past/recurring rules |
| `46_…sql` `cancel_booking` | 100–144 | Refunds packages | Skip guest refund | Wrong credit balance |
| `45_…sql` `mark_booking_not_attended` | 282–335 | Issues replacement | Explicit guest reject | Confusing errors / credit issuance |
| `38_…sql` `finalize_past_bookings` | 44–50 | booked→finished | Unchanged | — |
| `12_…sql` `ensure_session_slot*` | 155–173 | Find/create session | Reuse; optional unique slot index | Split capacity across duplicate sessions |
| `staff-booking-queries.ts` | 10–72 | `profiles!…!inner` | Left embed; select guest fields | Guests invisible on calendars |
| `month-calendar.ts` | `map_month_calendar_booking` 247–281 | Drops null `user_id` | Keep guests; guest subset counts | Hidden seats |
| `month-calendar-section.tsx` | BookingBox / SlotRow / DayCell | Client cards + cancelled summary | Guest card copy + count suffixes | Owner cannot see guest counts |
| `client-day-popup.tsx` | 64–116 | Client dashboard | Bypass; new guest detail dialog | Fake membership UI |
| `day-bookings.ts` | map/summarize | Requires profile | Guest attendee + guests summary | Day roster drops guests |
| `day-bookings-panel.tsx` | 87–119, 303–311 | Active/cancelled pills | Guests pill + copy | Incomplete day summary |
| `week-day-bookings.ts` + weekly overview UI | 160–198 | Active booking = “session” | Include guests once + suffix | Week under-reports |
| `staff-bookings.ts` `map_staff_booking` | 108–111 | Requires profile | Map guest label | History drops guests |
| `not-attended.ts` | 17–45 | Charge-based eligibility | Guest ineligible | Accidental Not attended UI |
| `booking-rpc-contract.ts` | `BookingSource` | 3 sources | Add `staff_guest` + codes | Contract tests drift |
| `client-booking-manager-panel.tsx` | 147–165 | Client-first | Guest booking entry | No entry without fake client |
| `manual-booking-tab.tsx` | whole | Packages required | Unchanged | Do not overload |
| `slot-booking-picker.tsx` | `on_confirm` | Books immediately | Selection step for guests | Accidental package booking |
| `schedule-actions.ts` | 164–173 | Counts booked | No change once readable | — |
| Account pages | `user_id` filter | Own bookings | No change | Confirm null user excluded |
| Notifications / exports / stats | — | None found | n/a | — |
| Recurring forecast/materialize | ends in core | Capacity P0015 | Sees guest seats via core | — |

## 9. UI/UX and Mobile Design

### Entry layout

Wide: `ClientSelector` + **Guest booking** on one row.  
375–390px: selector full width; Guest booking full-width secondary button immediately below. Recurring rules stays on its current secondary row.

### Dialog

- No package selector.
- Picker reused for card/date/time.
- Attendee list: “Guest 1…N”; Add another / remove; focus management on add/remove.
- Primary: `Book N guests`; pending `Booking…`; success toast then close; errors keep names.
- Advisory capacity; server is authoritative.

### Calendar card

Keep class-type color (`BOOKING_KIND_CLASS`). Do not replace with a guest-only color.

```text
Maria
Guest · Reformer
Booked
```

Text badge “Guest” + status word (always show status on guest cards). `aria-label` includes name, Guest, class, status. Compact name may shorten the button; detail shows full label.

### Guest detail

Fields: full label, Guest indicator, session date/time/type, note or “No note”, created-by staff name, `booked_at`, status.  
Actions: Edit details; Cancel when `booked`.  
No memberships / booking-history / add-booking tabs.  
Stacking: day detail `z-50` inert while guest dialog `z-[60]`; Escape closes topmost; restore focus to card; preserve scroll.

## 10. State and Permission Matrices

### Registered vs guest

| Concern | Registered client | Guest |
| --- | --- | --- |
| Account | required | none |
| Package / charges | required for book | none; `credits_used = 0` |
| Capacity | 1 place if `booked` | same |
| Duplicate person rule | unique active per user+session + slot conflict | N/A (null user); names not unique |
| Source | client / staff_manual / recurring | staff_guest |
| Creator | client null or staff id | staff id required |
| Cancel refund | yes if charged | never |
| Recurring skip on cancel | if recurring | never |
| Finalize | booked→finished | same |
| Not attended | compensated path | rejected |
| Client Account visibility | own rows | never |
| Staff calendar | profile name | guest_label |

### Status / actions for guests

| Status | How | Edit label/note | Cancel | Not attended |
| --- | --- | --- | --- | --- |
| booked | insert | yes | staff yes | no |
| finished | finalize cron | yes | no (`P0012`) | no |
| cancelled | staff cancel | yes | no | no |
| waitlisted / attended / no_show / not_attended | not produced for guests | — | — | — |

### Roles

| Action | instructor | admin/owner | client | anon |
| --- | --- | --- | --- | --- |
| Create guest batch | yes (RPC) | yes | no | no |
| View guest label/note | yes (staff RLS) | yes | no | no |
| Edit guest details | yes (RPC) | yes | no | no |
| Cancel guest | yes (RPC) | yes | no | no |
| Occupancy counts without names | existing session/booking count patterns | same | own booked rows only | session metadata only |

## 11. Test and Verification Plan

### SQL fixtures

Extend `supabase/tests/booking_core_regression.sql`; add `supabase/tests/staff_guest_bookings.sql` (style of `not_attended_replacement.sql`).

**Capacity / idempotency:** one guest; batch of three; share capacity with registered; full reject; batch exceeds capacity → zero inserts; overlapping guest+client seat math; same request id replay; same id different payload → `P0041`; same name different request ids allowed; registered duplicate still `P0013` / unique index; `P0004` / `P0032` / gate off / non-staff.

**Credits / history:** package balances unchanged; no charges; guest Not attended → `P0043`; registered refund + Not attended unchanged; cancel frees seat; finalize guest; second cancel `P0012`; no recurring skip; edit writes audit event.

True concurrent races: document in staging pack (`docs/booking-staging-validation-pack.md`); SQL covers lock-order predicates.

### App unit / RTL

- `booking-rpc-contract.test.ts` — new source/codes
- `month-calendar.test.ts` — guests kept; subset; cancelled guests
- `day-bookings.test.ts` / week tests — mapping + counts
- `staff-bookings.test.ts` — history map
- `session-availability.test.ts` — live vs cancelled
- `not-attended.test.ts` — guest ineligible
- `staff-booking-queries.test.ts` — left embed; no bare `profiles!inner`
- `client-booking-manager-panel.test.tsx` — entry without client
- new `guest-booking-dialog.test.tsx` — rows, validation, pending, capacity drop
- `month-calendar-section.test.tsx` — card a11y, hour suffix, no client dashboard fetch

### E2E

Playwright only if staff auth fixture exists; else staging manual: 375px + desktop, book two guests, counts, edit note, cancel one, picker places return.

### Security checks

- Client JWT cannot execute successful guest create
- Client select cannot return guest labels/notes
- Actor columns always `auth.uid()`

## 12. Migration and Deployment Plan

1. **Backup** database before applying script 48 (same bar as payment recovery runbook).
2. Apply `48_staff_guest_bookings.sql` with `staff_guest_bookings = false`. Existing 824 rows pass shape check.
3. Deploy app that left-joins guests, renders cards/counts, and calls RPCs.
4. Enable gate with `UPDATE private.feature_gates …`.

### Compatibility

| Combo | Behavior |
| --- | --- |
| Old app + new columns + 0 guests | OK |
| Old app + guest rows | Inner joins hide guests; capacity still counts → under-shown occupancy. **Do not enable gate on old deploy** |
| New app + old DB | RPC missing → clear error; never fall back to `staff_book_session_for_client` |

### Rollback limits

- Disable gate: stops new groups; existing guests remain until cancelled by a guest-aware build.
- Reverting app code does **not** make old calendars show guest rows.
- Dropping columns destroys labels/notes — not a rollback.
- Restoring NOT NULL is impossible while guests exist.
- Old `cancel_booking` against a shape-valid guest (`credits_used = 0`, null package) updates zero packages; the shape check is what keeps that safe.

## 13. Remaining Questions and Recommended Answers

No material product questions remain after inspecting live capacity, display-active, occupancy, cancelled summaries, Not attended, and staff roles.

Locked by evidence + approved requirements (not re-asked):

- Staff-only; no account/tokens; external payment; multi-attendee batch; shared capacity; label+note; guest calendar styling/counts; no guest recurring; no guest compensated Not attended.
- Option A on `bookings`; request UUID idempotency; extend `cancel_booking`; finalize guests to finished; gate off until readers ship; label 1–80 / note 0–500; all existing session-card types share capacity.

If review rejects any locked technical choice, stop before implementation — there is no unresolved fork that requires the owner to pick SQL details.

## 14. Ordered Implementation Checklist

| # | Dependency | Work | Acceptance |
| --- | --- | --- | --- |
| 1 | Backup complete | Write `supabase/48_staff_guest_bookings.sql` (columns, shape check, request table, audit table, RPCs, cancel/Not attended guards, gate false) | SQL tests pass on staging; gate false; existing row count unchanged |
| 2 | Script 48 applied | Update `staff-booking-queries` to left embed + guest fields; fix month/day/week/history mappers | Unit tests: guests appear once; cancelled guests not in guest subset |
| 3 | Readers ready | Guest calendar card + count suffixes + day/week pills | RTL matches cancelled-style suffix patterns |
| 4 | Readers ready | Guest detail dialog (edit/cancel); no ClientDayPopup for guests | Escape/focus/scroll stacking tests pass |
| 5 | RPCs live | Client Booking Manager entry + guest dialog + `staff_book_guests` action | Book without client selected; no package UI |
| 6 | 1–5 deployed | Enable `staff_guest_bookings` | Create 1 and N guests; concurrency staging pack green; disable gate stops new creates |
| 7 | Feature on | Docs/log: implementation log + decision-log entry | Report acceptance criteria signed off |

**Measurable release criteria:** guests occupy shared `booked` capacity; no package balance change; calendars show guest cards and subset counts; clients cannot read guest details; Not attended never issues guest credits; rollback = gate off without claiming old app can render guest rows.

---

### Log record

**Purpose:** Evidence-backed design for staff guest bookings without changing app or database.  
**Actions:** Read-only repository and production catalog inspection; rewrite planning report to required 14-section structure.  
**Files changed:** this planning log only.  
**Verification:** Live `book_session_core` matches script 41; 824/824 bookings have user+package; RLS on; no migrations applied.  
**Next:** Review this report; then a separate implementation prompt.
