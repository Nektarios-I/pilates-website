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

**Optional — legacy DBs only:** If you previously seeded old `a0000000-…` packages, run `13_migrate_legacy_packages.sql` once after step 4. Fresh installs skip this.

**Optional — dev demo users:** Before step 4, run `select set_config('app.seed_demo_data','true',false);` then uncomment the demo block in `04_seed.sql`.

---

## Wipe test data (keep schema)

Dev/staging only:

```sql
set app.allow_data_reset = 'true';
-- then run the full 05_reset_data.sql file
```

This clears application tables and `auth.users`, then re-seeds packages and default session cards. Re-run `10_add_admin.sql` afterward so you can sign in again.

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
