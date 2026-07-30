# Supabase SQL scripts

Numbered scripts are the **canonical** way to set up this project. Run them in order in the Supabase SQL Editor (as `postgres`).

Do **not** also run `migrations/lates_migrations_01-03.sql` — that file is an old bundled copy of scripts 01–03 kept for reference only.

---

## First-time setup (new project)

Run each file **once**, top to bottom:

| Step | File | Purpose |
|------|------|---------|
| 1 | `01_schema.sql` | Tables, triggers, indexes, auth → profile trigger |
| 2 | `02_rls.sql` | RLS policies + `private` helper functions |
| 3 | `03_functions.sql` | Booking RPCs (`book_session`, etc.) |
| 4 | `04_seed.sql` | Reformer + mat package catalog and default session cards |
| 5 | `14_update_reformer_3month_prices.sql` | Idempotent price sync (owner updates); run after step 4 on existing DBs |
| 5 | `11_staff_invites.sql` | Optional `staff_invites` table |
| 6 | `12_studio_schedule.sql` | Studio hours + booking slot helpers |
| 7 | `09_cron.sql` | Daily `expire_packages()` job (enable **pg_cron** extension first) |
| 8 | `10_add_admin.sql` | Your initial admin account (edit email inside first) |
| 9 | `14_contact_messages.sql` | Public contact form storage + admin inbox RLS |
| 10 | `16_account_safety_mirror.sql` | Account profile safety mirror + backfill (excluded from data reset) |
| 11 | `17_booking_one_per_time_slot.sql` | One booking per time slot per client (P0013) |
| 12 | `18_recurring_prebook_schema.sql` | Recurring prebook tables + booking provenance columns |
| 13 | `19_booking_core_refactor.sql` | Shared `private.book_session_core` + public wrapper refactor |
| 14 | `20_staff_booking_rpc.sql` | Staff-on-behalf booking RPCs |
| 15 | `21_cancel_booking_staff_auth.sql` | Staff cancel parity + package visibility |
| 16 | `22_recurring_prebook_functions.sql` | Recurring CRUD, forecast, materialization, retry |
| 17 | `23_recurring_prebook_cron.sql` | Daily pg_cron materialization job |
| 18 | `24_public_full_fail_cancel_cutoff.sql` | No public waitlist + 2h client cancel cutoff |
| 19 | `25_recurring_skip_validation.sql` | Recurring skip must match active schedule line (P0031) |
| 20 | `26_delete_recurring_rule.sql` | Hard-delete recurring prebook rules (staff) |
| 21 | `27_booking_horizon_recurring_priority_forecast.sql` | 14-day horizon, recurring gate, token forecast |
| 22 | `28_staff_client_materialization.sql` | Client-scoped materialization + exclusion dialog RPCs |
| 23 | `29_fix_recurring_forecast_volatility.sql` | Fix forecast STABLE + temp table error |
| 24 | `30_cancel_booking_recurring_sync.sql` | Cancel clears stale materialization logs; forecast/gates ignore cancelled bookings |
| 25 | `31_materialize_selection_atomic.sql` | Atomic per-client selection materialize + live-booking skip guard |
| 26 | `32_materialize_selection_schedule_line.sql` | `schedule_line_id` matching in selection payload |
| 27 | `33_optional_profile_contact.sql` | Optional profile email; unique phone index; internal auth emails |
| 28 | `34_fix_duplicate_profile_phones.sql` | Dedupe duplicate phones if migration 33 index fails (conditional) |
| 29 | `35_cron_materialize_live_booking_check.sql` | Align daily cron skip guard with live-booking check (run after 34) |
| 30 | `36_client_cancel_four_hour_cutoff.sql` | Client self-cancel cutoff 4 hours (P0029) |
| 31 | `37_profiles_rls_staff_directory.sql` | Restrict profile reads: staff see all; clients see staff directory + own row |
| 32 | `38_finalize_past_bookings.sql` | Auto-mark past `booked` rows as `finished` + hourly pg_cron |
| 33 | `39_package_lifecycle_alignment.sql` | Package lifecycle grouping, extend/reactivate, audit |
| 34 | `40_recurring_materialize_failure_visibility.sql` | Durable cron failures; staff-cancel skip; package-expiry warnings; client planned slots |

**Optional — legacy DBs only:** If you previously seeded old `a0000000-…` packages, run `13_migrate_legacy_packages.sql` once after step 4. Fresh installs skip this.

**Optional — dev demo users:** Before step 4, run `select set_config('app.seed_demo_data','true',false);` then uncomment the demo block in `04_seed.sql`.

---

## Upgrade an existing database (incremental)

| If you have… | Run… |
|--------------|------|
| Scripts 01–17 only | `18_recurring_prebook_schema.sql` |
| Script 18 only | `19` → `20` → `21` (in order) |
| Scripts 01–18 | `19` → `20` → `21` |
| Scripts 01–21 | `22` → verify with `supabase/tests/recurring_prebook_regression.sql` → `23` |
| Scripts 01–23 | `24_public_full_fail_cancel_cutoff.sql` |
| Scripts 01–24 | `25_recurring_skip_validation.sql` |
| Scripts 01–25 | `26_delete_recurring_rule.sql` |
| Scripts 01–26 | `27_booking_horizon_recurring_priority_forecast.sql` |
| Scripts 01–27 | `28_staff_client_materialization.sql` |
| Scripts 01–28 | `29_fix_recurring_forecast_volatility.sql` |
| Scripts 01–29 | `30_cancel_booking_recurring_sync.sql` |
| Scripts 01–30 | `31_materialize_selection_atomic.sql` → verify with `supabase/tests/materialize_selection_regression.sql` |
| Scripts 01–31 | `32_materialize_selection_schedule_line.sql` |
| Scripts 01–32 | `33_optional_profile_contact.sql` |
| Scripts 01–33 (phone index failed) | `34_fix_duplicate_profile_phones.sql` then finish 33 if needed |
| Scripts 01–34 | `35_cron_materialize_live_booking_check.sql` |
| Scripts 01–35 | `36_client_cancel_four_hour_cutoff.sql` |
| Scripts 01–36 | `37_profiles_rls_staff_directory.sql` |
| Scripts 01–37 | `38_finalize_past_bookings.sql` |
| Scripts 01–38 | `39_package_lifecycle_alignment.sql` |
| Scripts 01–39 | `40_recurring_materialize_failure_visibility.sql` |

After `19`–`24`, run `supabase/tests/booking_core_regression.sql` and `supabase/tests/booking_policy_regression.sql` on dev/staging.

After `22`, run `supabase/tests/recurring_prebook_regression.sql` before enabling cron (`23`).

Public `book_session` wrappers fail on full capacity (no waitlist). Public and staff manual booking use a **14-day horizon** and wait for recurring materialization before a slot opens (migration 27).

**Booking window (migration 27):** public/staff can book within 14 days; slots with pending recurring prebooks stay reserved until materialization runs (daily cron or `staff_materialize_recurring_prebooks()`).

**Migration 27 re-run:** If you see `cannot change return type of existing function` for `get_recurring_prebook_forecast`, the script now includes `DROP FUNCTION` before recreating it. Re-run the full `27_booking_horizon_recurring_priority_forecast.sql` file (safe to re-run).

**Cancellation policy (migration 36):** client self-cancel blocked within 4 hours of class start (P0029); staff may cancel anytime.

---

## Wipe test data (keep schema)

Dev/staging only:

```sql
set app.allow_data_reset = 'true';
-- then run the full 05_reset_data.sql file
```

`05_reset_data.sql` truncates recurring prebook tables (before `bookings`) and clears application data and `auth.users`, then re-seeds packages and default session cards. Re-run `10_add_admin.sql` afterward so you can sign in again.

`account_safety_mirror` is **not** truncated by `05_reset_data.sql` (safety mirror).

---

## Upgrade an existing database for mat/reformer packages

If your database already has the earlier booking system, run these files in this order:

1. `01_schema.sql`
2. `02_rls.sql`
3. `03_functions.sql`
4. `04_seed.sql`
5. `12_studio_schedule.sql`

This adds `packages.class_type`, creates `session_cards`, creates `booking_credit_charges`, updates booking validation, seeds mat packages, and updates the slot helper signature. You do **not** need to reset data unless you want a clean dev database.

For the latest session-card credit split (`reformer_credits_required` and `mat_credits_required`), run the same upgrade order above.

---

## Full teardown (start completely fresh)

Dev/test only:

1. `06_drop_all.sql`
2. Run the first-time setup list above from `01_schema.sql`

`06_drop_all.sql` does **not** delete `auth.users`. Run `05_reset_data.sql` (with the safety flag) if you only need to clear data including auth.

After `05_reset_data.sql`, run:

1. `04_seed.sql`
2. `10_add_admin.sql`

---

## Debug only (never production)

| File | Purpose |
|------|---------|
| `07_disable_rls.sql` | Temporarily disable RLS |
| `08_enable_rls.sql` | Re-enable RLS |

---

## `seed.sql`

Duplicate of `04_seed.sql` for Supabase CLI convention. **Edit `04_seed.sql` first**, then copy changes to `seed.sql`, or run `04_seed.sql` directly.
