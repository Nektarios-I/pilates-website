# Production Readiness Audit

**Date:** 2026-07-11  
**Actor:** cursor  
**Category:** review  
**Scope:** Full-stack audit after migrations 18–34 applied; UI copy rename (Login / slots); migration 35 added for cron fix.

---

## Executive summary

The website is **functionally ready for an owner demo** and **near production-ready for core client flows** (login, book, cancel, account). **Recurring prebook automation** is the highest-risk area: it depends on pg_cron, migrations **30–35**, and operator verification.

| Area | Status |
|------|--------|
| Client login (email / name / phone) | Ready — requires `SUPABASE_SERVICE_ROLE_KEY` for name/phone |
| Public booking + cancel | Ready — good unit + e2e coverage |
| Staff invite / membership / client manager | Ready — server + SQL guards; redirect URLs must be configured |
| Recurring rules + materialize dialog | Ready — requires migrations 31–32 applied |
| Recurring **daily auto-booking** as window rolls | Ready **if** pg_cron (23) + migration **35** applied |
| Documentation / ops runbooks | Needs update (README partially fixed today) |
| Automated e2e for staff/recurring | Gap — manual verification recommended before go-live |

**Assumption after this audit:** If you apply migration **35**, verify pg_cron jobs, and confirm env vars on Vercel, the site can be treated as production-ready for studio use.

---

## Changes made during this session

### UI copy (user-facing)

- **Sign in → Login** across header, login page, book page, middleware message, auth pages, invite form, account password copy, e2e smoke tests.
- **Tokens → slots** in recurring staff UI labels (`format.ts`, materialize dialog, recurring tab, RPC error mapping). Internal code identifiers (`insufficient_tokens`, `token_health`) unchanged — display only.

### Code / SQL fix

- **`supabase/35_cron_materialize_live_booking_check.sql`** — aligns daily cron `materialize_recurring_prebooks()` with migration 30’s live-booking skip guard (`private.recurring_log_has_active_booking`). Without this, cancelled recurring occurrences stay permanently skipped by cron.
- **`supabase/README.md`** — documented migrations 30–35 in first-time and incremental upgrade tables.

### Verification run

- `npm run lint` — pass  
- `npm run test` — **205 passed**  
- `npm run build` — pass  

---

## Recurring prebook: how the rolling window works

This answers the specific question: *“Will recurring rules keep booking sessions as days pass after the current window moves?”*

### Window definition

- Horizon: **15 calendar days** — from `studio_today()` through `studio_today() + 14` (Europe/Nicosia).
- Defined in SQL: `private.recurring_window_end_date()`, `private.recurring_materialization_horizon_days()` (migration 22/27).

### What happens each day

1. **`studio_today()` advances** at midnight Nicosia time.
2. **Yesterday’s first day drops out** of the materialization window.
3. **A new day enters** at the far end (today + 14).
4. **Daily pg_cron job** (`materialize-recurring-prebooks-daily`, 04:00 UTC, migration 23) calls `materialize_recurring_prebooks()` for all **active** rules and **active** schedule lines matching each weekday in the window.
5. For each occurrence, the function either creates a booking (deducting credits) or logs a failure (capacity, insufficient credits/slots, etc.).

### Manual vs automatic materialization

| Trigger | Function | When used |
|---------|----------|-----------|
| Daily cron | `materialize_recurring_prebooks()` | Automatic — all clients, all rules |
| Staff “Run materialization now” | `staff_materialize_client_recurring_selection()` | Per-client, selected rows (migrations 31–32) |
| Staff batch (no UI) | `staff_materialize_recurring_prebooks()` | SQL-only global rerun |

### Forecast / UI refresh

- Forecast is **recomputed on load** and after staff actions (materialize, skip, rule edit) via `forecast_revision` bump in `recurring-tab.tsx`.
- **No live polling** — a staff tab left open overnight will not auto-refresh when cron runs; reload or trigger an action to see updated states.
- **Client-facing book page** uses RPC gates; slots blocked by pending recurring prebooks stay blocked until materialization succeeds.

### Cancel + re-materialize behavior

- Migration **30**: cancelling a recurring booking clears/syncs materialization log so forecast shows “Planned” again; staff selection materialize can retry.
- Migration **35** (new): same live-booking check for **cron** — without it, cron sees old `status = succeeded` log and **never retries** after cancel.

**Action required:** Run `35_cron_materialize_live_booking_check.sql` in Supabase if not already applied.

---

## Issue register

Severity: **CRITICAL** = blocking recurring or core ops · **HIGH** = fix before public launch · **MEDIUM** = fix or accept · **LOW** = polish · **IGNORE** = safe to defer

---

### CRITICAL

#### C1 — Migration 35 must be applied for cron re-materialization

**Problem:** Cron still used migration 22 skip logic (any `succeeded` log) until migration 35. Cancelled recurring slots would not auto-rebook on subsequent cron runs.

**Fix:** Run `supabase/35_cron_materialize_live_booking_check.sql`.

**Verify:**
```sql
-- After canceling a recurring booking, confirm log no longer blocks retry:
select public.materialize_recurring_prebooks();
-- Or wait for cron at 04:00 UTC
```

**Blocking:** Yes for recurring prebooks.

---

#### C2 — pg_cron jobs must exist and run

**Scripts:**
- `09_cron.sql` — `expire-packages-daily` (02:00 UTC)
- `23_recurring_prebook_cron.sql` — `materialize-recurring-prebooks-daily` (04:00 UTC)

**Verify:**
```sql
select jobid, jobname, schedule, command from cron.job;
```

**Blocking:** Yes for package expiry automation and recurring auto-booking.

---

#### C3 — `SUPABASE_SERVICE_ROLE_KEY` on production server

**Used for:** name/phone login resolution, staff invite, membership, pricing admin, schedule admin, remove client, phone dedupe lookup.

**Location:** `src/lib/supabase/admin.ts`, `src/app/(marketing)/login/actions.ts`, all `staff/*/actions.ts`.

**Blocking:** Yes — name/phone login and all staff admin flows fail without it.

---

#### C4 — Full migration chain 18–35 on production DB

**Problem:** README previously stopped at 29; operators on partial DBs miss cancel sync, selection materialize, optional contact, cron fix.

**Status:** README updated 2026-07-11 with steps 30–35.

**Blocking:** Yes if any of 30–35 missing on the live DB.

---

#### C5 — Stale setup docs reference wrong migration path

**Problem:** `docs/general/supabase-setup.md` references non-existent `supabase/migrations/20260614000001_initial_schema.sql` and `npx supabase db push`. Canonical path is numbered `01`–`35` in SQL Editor.

**Action:** Update setup doc to point at `supabase/README.md`.

**Blocking:** Yes for anyone following old docs on a fresh project.

---

### HIGH

#### H1 — Supabase Auth redirect URLs

**Required in Supabase dashboard (production domain):**
- `/auth/callback`
- `/auth/invite`
- `/auth/invite-callback` (legacy query-param invites)
- Password reset → `/auth/reset-password`

**Source:** `staff/invite/actions.ts` sets `redirectTo` for invite emails.

**Blocking:** Staff email invite flow only.

---

#### H2 — Environment variables not fully documented in deployment runbook

**Required on Vercel (server + public):**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin (never public) |
| `CRON_SECRET` | Protects `/api/indexnow` |
| `INDEXNOW_KEY` | IndexNow submissions |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact display (optional but recommended) |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | Live map embed (optional) |

**Action:** Sync `docs/general/environment-matrix.md` and `deployment-runbook.md` with `.env.example`.

---

#### H3 — Middleware auth-only for `/staff/*`

Any logged-in **client** can load some staff URLs (`/staff/invite`, `/staff/membership`, `/staff/remove`). Mutations are guarded in server actions + SQL RPCs, but UI shells are visible.

**Recommendation:** Add staff role check in middleware or shared staff layout (match `client-bookings/page.tsx` pattern).

**Blocking:** No — defense in depth only.

---

#### H4 — Profiles RLS exposes all columns to authenticated users

Policy in `02_rls.sql`: authenticated users can `select` all profile rows including staff `notes`.

**Recommendation:** Restrict `notes` to staff-only view/RPC.

**Blocking:** No unless notes contain sensitive data.

---

#### H5 — Phone login O(n) profile scan

`lookup_profiles_by_phone()` loads all profiles with phones, filters in JS. Works at launch scale; does not scale.

**Recommendation:** Future DB RPC with normalized phone index (migration 33 index exists).

**Blocking:** No at current scale.

---

#### H6 — No e2e for staff / recurring journeys

**Covered:** `e2e/booking-flow.spec.ts` (client book + cancel), smoke redirects.

**Not covered:** Staff invite, membership, client booking manager, recurring CRUD, materialize dialog.

**Recommendation:** Add authenticated staff e2e project before relying solely on recurring automation.

**Blocking:** No — manual QA acceptable for initial launch.

---

#### H7 — Google Maps still placeholder

`site_content.ts`: `map_embed_mode: 'placeholder'`. Contact page uses link, not embed.

**Action:** Set embed URL + switch mode when ready.

**Blocking:** No.

---

### MEDIUM

#### M1 — Booking UI fails open if recurring RPC errors

`schedule-actions.ts`: if `list_open_slot_starts_for_day` fails, all slots show as open in UI; DB still rejects at book time.

**Recommendation:** Fail closed or show error banner.

---

#### M2 — Past-slot check uses browser local timezone

`booking-ui.ts` vs DB `Europe/Nicosia` — edge case for non-Cyprus users.

---

#### M3 — Staff pages without page-level role redirect

`membership`, `invite`, `remove` pages don’t redirect non-staff to `/account`.

---

#### M4 — No privacy/terms pages

`site_content.footer_content.legal_links` is empty. Add before launch if legally required.

---

#### M5 — Blog routes are placeholders

`/blog` shows placeholder content — hide or populate.

---

#### M6 — Long-open staff sessions don’t auto-refresh forecast

Operational expectation: staff reloads client manager after overnight cron, or uses materialize dialog.

---

#### M7 — No auto-materialize when adding new recurring schedule line

New weekly slots stay “Planned” until cron (04:00 UTC) or manual “Run materialization now”.

**Acceptable** if staff are trained to materialize after rule changes.

---

### LOW

- README duplicate step number “5” in first-time table (cosmetic).
- `classes/page.tsx` dead FAQ fallback strings.
- Deployment doc drift on `NEXT_PUBLIC_BOOKING_URL` fallback.

---

### SAFE / IGNORE

| Item | Notes |
|------|-------|
| Form placeholders (`you@example.com`) | Standard UX |
| `example.com` in unit tests | Fixtures only |
| `/design` sandbox | Internal only |
| Internal auth emails `@accounts.corehouse.internal` | By design (migration 33) |
| 205 unit tests passing | Good baseline |
| SQL staff guards (`private.is_staff()`, `assert_recurring_staff()`) | Mutations protected |
| IndexNow key file in `public/` | Matches `.env.example` |

---

## Main workflow verification

| Workflow | Expected behavior | Verified by |
|----------|-------------------|-------------|
| Login (email + password) | Session cookies, redirect to `/account` | Unit tests + e2e smoke |
| Login (NAME SURNAME) | Admin resolves profile → auth email → password | Unit tests; needs service role in prod |
| Login (phone) | Unique phone match → auth email | Migration 33/34; needs service role |
| Book class | 14-day horizon, package credits, P0013 one-per-slot | e2e `booking-flow.spec.ts` |
| Cancel class | 2h cutoff for clients (P0029); staff anytime | Unit + e2e |
| Staff invite | Manual account + optional email/phone | Actions tested; redirect URLs manual |
| Staff membership apply/remove | Admin RPC + FK handling | Unit tests |
| Recurring rule CRUD | SQL RPCs + UI tabs | Unit tests; manual QA recommended |
| Materialize selection | Atomic RPC, booking_ids returned, UI refresh | Migrations 31–32 + dialog tests |
| Daily recurring roll-forward | Cron + window math | SQL logic reviewed; **requires C1 + C2** |
| Package expiry | Cron 09 | Requires pg_cron |

---

## Pre-launch checklist (recommended order)

1. [ ] Confirm migrations **01–35** applied (especially **30, 31, 32, 33, 34 if needed, 35**).
2. [ ] Verify pg_cron jobs: `expire-packages-daily`, `materialize-recurring-prebooks-daily`.
3. [ ] Set all Vercel production env vars (see H2).
4. [ ] Configure Supabase Auth redirect URLs (see H1).
5. [ ] Run SQL regression scripts on staging: `recurring_prebook_regression.sql`, `materialize_selection_regression.sql`.
6. [ ] Manual smoke: staff invite → client login (name) → book → recurring rule → materialize → cancel → verify re-materialize.
7. [ ] Replace map placeholder + contact email if going fully public.
8. [ ] Update `supabase-setup.md` and deployment runbook (C5, H2).

---

## Decision: production-ready?

**Core studio operations (booking, login, staff admin):** Yes, after env vars and redirect URLs are confirmed.

**Recurring prebook automation:** Yes, **after migration 35 + pg_cron verification**. Without those, recurring is “staff-manual only” and public slots may stay blocked incorrectly after cancels.

**Recommendation:** Apply migration 35 today, verify `cron.job`, run one manual cancel → materialize cycle, then treat the site as ready for production use.

---

## Next recommended actions

1. Apply `35_cron_materialize_live_booking_check.sql` in Supabase SQL Editor.
2. Run `select * from cron.job;` and confirm both jobs active.
3. Manual test: create recurring rule → wait for or trigger materialize → cancel one booking → confirm cron or manual materialize re-books.
4. Optional follow-up PR: staff middleware role gate, setup doc fixes, staff e2e tests.
