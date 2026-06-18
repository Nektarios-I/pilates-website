# SQL script audit and consolidation

**Date:** 2026-06-18  
**Task:** Audit all `supabase/*.sql` scripts for compatibility, completeness, and single-purpose scope.

## Changes

- **05_reset_data.sql** — Truncates all 8 app tables (`staff_invites`, `studio_day_schedule` added); clears `auth.identities` + `auth.users`; re-seeds `b000…` packages (matches `04_seed.sql`).
- **06_drop_all.sql** — Drops tables/functions from scripts 11–12; full teardown list aligned with current schema.
- **07/08** — RLS toggle includes `staff_invites` and `studio_day_schedule`.
- **09_cron.sql** — Replaced invalid `ON CONFLICT` on `cron.schedule` with unschedule-then-schedule pattern.
- **10_add_admin.sql** — Ensures `pgcrypto` extension; documents re-run after reset.
- **11_staff_invites.sql** — Added admin RLS policy + grants (was RLS-on with no policies).
- **01_schema.sql** — Added `idx_profiles_full_name` (was only in old `13`).
- **13_migrate_legacy_packages.sql** — Replaces `13_reformer_packages.sql` as optional legacy upgrade only.
- **04_seed.sql / seed.sql** — Demo block uses `b000…` package ID; `seed.sql` header points to canonical `04_seed.sql`.
- **migrations/lates_migrations_01-03.sql** — Deprecation banner added.
- **supabase/README.md** — Run order and warnings documented.

## Verification

- Manual review of all numbered scripts for cross-references and drop/truncate coverage.
- App code unchanged; no lint/build required for SQL-only edits.

## Next action

Run scripts per `supabase/README.md` on Supabase SQL Editor. After any `05_reset_data.sql`, re-run `10_add_admin.sql`.
