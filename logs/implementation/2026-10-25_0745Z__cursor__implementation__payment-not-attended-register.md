# Payment and Not attended implementation register

- date: 2026-10-25
- actor: cursor
- category: implementation
- topic: payment-not-attended-register
- branch: master
- commit: 4aeec7c7c02ec338b786db69c588fc9b720b9b1b
- related plan: logs/planning/2026-10-07_0645Z__cursor__planning__payment-and-not-attended-discovery.md
- related prompt: offline payment tracking and Not attended replacement-credit implementation
- status: local Not attended migration verified; Drive sync and portable key still pending; popup UI not started

## Backup protection, 2026-10-25 20:42 UTC

Encrypted files were copied to `G:\My Drive\Pilates Website Recovery\production-xzlirjwzpmvugkbhtzxw-20261025T201829Z`. 15 ciphertext files. Checksums matched the local encrypted copy. The Drive folder also has a sanitized `recovery-manifest.json`. It does not contain plaintext dumps, credentials, or the decryption key.

A local decrypt of `consistency-checks.txt.enc` matched the plaintext aggregate file, then the temporary plaintext was deleted. The key used for that test is Windows DPAPI for this user. It cannot be used after this Windows account is lost. A portable passphrase wrap is not created yet.

Google Drive for desktop (`GoogleDriveFS`) is running. Upload completion was not confirmed.

Payment tracking code was not present and was not started.

Public smoke without signing in: home 200, book 200, login 200, staff day bookings 307 to the login page. Authenticated staff interaction was not verified.

Not attended function `public.mark_booking_not_attended(uuid)` is absent on the local rehearsal database.

Baseline unit tests on 2026-10-25: 1 failed, 366 passed. The failure was `staff_manual_book_slot` using the fixed date 2026-08-20, which is now before the studio today. The fixture now uses a studio date 14 days ahead. That file then passed 18/18. The assertion was not weakened.

`not-attended.test.ts` first failed because `./not-attended` did not exist. The pure eligibility, 30-day expiry, and booking-group helpers were then added. Those 18 tests passed. Database issuance, concurrency, RLS, and browser tests are not written yet.

## Pass 1 result, 2026-10-25 20:26 UTC

Read-only connection to the production session pooler succeeded. Database `postgres`, server 17.6. The password was not printed.

Backup `production-xzlirjwzpmvugkbhtzxw-20261025T201829Z` completed at 2026-10-25T20:20:24Z. Plaintext and encrypted checksums matched. Auth users 76, profiles 76. Bookings 742, credit charges 742, owned packages 147. Public policies 46. Relationship orphan counts were 0. `pg_dump` 17.6.

Local restore into `pilates-recovery-rehearsal` on 127.0.0.1:55432 took 17.7 seconds. Row counts, consistency checks, function names, 46 policies, and `user_roles_id_seq` 78 matched. `pg_cron` is not installed there. This did not restore GoTrue login.

The football project container and volume were still present afterward. Encrypted second copy is on the same PC. Off-machine copy was not made.

## Pass 1 continuation, 2026-10-25 08:21 UTC

Docker Engine 29.6.2 is running. `postgres:17.6` was pulled (`sha256:00bc86618629af00d2937fdc5a5d63db3ff8450acf52f0636ec813c7f4902929`). No Pilates container or volume was created yet.

The other project's containers, volume `footbalbettingplatform_postgres_data`, and network `footbalbettingplatform_default` were not stopped, removed, or reused. Its Postgres remains `footbalbettingplatform-postgres-1` on `127.0.0.1:5433`.

Recovery target, when the rehearsal runs, will be container `pilates-recovery-rehearsal`, volume `pilates-recovery-pgdata`, bound only to `127.0.0.1:55432`. That is vanilla Postgres 17, not a full Supabase stack. It will not be described as a complete production rollback.

Credential entry is `scripts/recovery/save-backup-credentials.ps1`. It uses a masked dialog and Windows DPAPI. The password is not stored in Git or in an environment variable.

Encryption round-trip for a sample file succeeded (magic `PRB1`). No production backup exists yet, so there is no second copy and no restore duration.

## Next recommended action

Owner runs the credential dialog. Do not start the production dump before that. Do not start Pass 2.

## Purpose

Track the five-pass payment and Not attended implementation. This entry records Pass 1. Feature code has not been changed.

## Inputs / context used

- Discovery report at commit `4aeec7c`. Working tree still has no application source changes. Unrelated `.pyc` files and the discovery log are the only local differences.
- Supabase project list: one project, `xzlirjwzpmvugkbhtzxw`, eu-west-1, Postgres 17.6.1.127, `ACTIVE_HEALTHY`. No branches.
- Official backup docs (`/guides/platform/backups`, `/guides/platform/migrating-within-supabase/backup-restore`) and CLI dump source at `46648500`.
- Read-only catalog inspection at 2026-10-25 07:39 UTC. No mutations.

## Actions performed

- Confirmed there is no local database password and no `pg_dump` on PATH. Docker Desktop's engine is stopped. `supabase` is not on PATH; `npx supabase` is 2.122.0 and still needs Docker plus the database password.
- Did not reset credentials, create a project, pause cron, or dump row contents.
- Added backup and local restore scripts plus the recovery runbook.

## Files changed or inspected

- Added `scripts/recovery/recovery-common.ps1`
- Added `scripts/recovery/backup-production.ps1`
- Added `scripts/recovery/restore-rehearsal.ps1`
- Added `docs/general/payment-feature-recovery-runbook.md`
- Updated `.gitignore` so dump files are not committed
- Inspected live catalogs only. No production DDL or data change.

## Commands run

- `git rev-parse` / `git status` / `git log`
- `docker info` (engine not running)
- Supabase MCP `list_projects`, `get_project`, `list_branches`, `list_edge_functions`, `list_extensions`, `list_migrations`
- Read-only `execute_sql` for schemas, cron, sessions, counts, triggers, policies, sequences, functions

## Result

Pass 1 gate is **blocked**. No backup artifact exists. Restore has not been demonstrated.

Inspection counts, which have moved since the 2026-10-07 discovery report: bookings 584, credit charges 584, sessions 249, owned packages 106, package events 205, profiles 76, auth users 76 with no linkage gaps. Storage buckets 0. Edge functions 0. Vault secrets 0. Public policies 46. Private functions 28, no private tables.

Recorded migrations are only the four CLI entries from July 2026. Numbered `supabase/*.sql` files remain the repo's canonical scripts. Next number is not assumed.

## Verification

Backup script was executed once:

`powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\recovery\backup-production.ps1`

Exit code 1. Docker reported the engine pipe was unavailable, and the script stopped before reading a database URL or writing a dump. Checksums, restore duration, and row-count comparison do not exist. All three recovery scripts parse as valid PowerShell.

## Blockers / risks

- Owner must supply the existing database URL locally and start Docker. Do not paste the URL into chat.
- Both planned backup copies land on this PC's disk until one is moved.
- Exports are ACL-private, not encrypted.
- `app-consistent.sql` is one snapshot. Auth, cron, storage, and the count file are separate later snapshots.
- Cron remains active. Post-snapshot writes will not be in the backup.
- Dashboard daily-backup and PITR entitlement was not visible through the API. Logical dump is the recovery path this runbook can execute.
- A git commit is not a database backup.

## Next recommended action

Owner starts Docker and sets `SUPABASE_DB_URL` to the session-pooler URI, then runs `backup-production.ps1` and `restore-rehearsal.ps1 -ConfirmDisposable`. Do not start Pass 2 until that rehearsal report passes.

## Pass status

| Pass | Status |
| --- | --- |
| 1 Backup and recovery | BLOCKED |
| 2 Tests-first contract | not started |
| 3 Database implementation | not started |
| 4 UI and browser verification | not started |
| 5 Release | not started |
