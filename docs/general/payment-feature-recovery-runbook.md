# Payment feature recovery runbook

This runbook is the pre-change recovery plan for offline package payments and Not attended replacement credits. It does not authorize a production restore.

## What was verified on 2026-10-25

| Item | Result |
| --- | --- |
| Production project | `xzlirjwzpmvugkbhtzxw` (`Nektarios-I's Project`, `eu-west-1`, Postgres 17.6, `ACTIVE_HEALTHY`) |
| Other Supabase projects or branches | None visible to the authenticated account |
| Application commit | `master` `4aeec7c7c02ec338b786db69c588fc9b720b9b1b` |
| Live deployment SHA | Not verified. The Vercel CLI is not installed, and the site does not publish the git commit. Production deploys from `master`. |
| Database password on this machine | Not present. `.env.local` has API keys only. |
| `pg_dump` | Not on PATH. The backup script uses the `postgres:17.6` image instead. |
| Supabase CLI | `supabase` is not on PATH. `npx supabase` resolves to 2.122.0. `db dump` still needs Docker and the database password. |
| Docker | Engine 29.6.2 running. Recovery resources use the `postgres:17.6` image, names starting `pilates-recovery-`, volume `pilates-recovery-pgdata`, and `127.0.0.1:55432`. |
| Other local Docker project | Left untouched: `footbalbettingplatform-postgres-1` on `127.0.0.1:5433`, volume `footbalbettingplatform_postgres_data`, network `footbalbettingplatform_default`. |
| Edge functions | None |
| Storage buckets and objects | None. There are no Storage file bytes to copy. |
| Vault secrets | 0 rows. The project root encryption key is still not part of a SQL dump. |
| Auth/profile linkage | 76 `auth.users`, 76 `profiles`, 0 orphans either way |
| Background writers | Active. Do not treat a quiet site as a quiet database. |

Active jobs, observed and not paused:

| Job | Schedule (UTC) | Command |
| --- | --- | --- |
| `expire-packages-daily` | `0 2 * * *` | `select public.expire_packages()` |
| `materialize-recurring-prebooks-daily` | `0 4 * * *` | `select public.materialize_recurring_prebooks()` |
| `finalize-past-bookings-hourly` | `15 * * * *` | `select public.finalize_past_bookings()` |

A logical dump is a snapshot. It does not need these jobs paused. Writes that commit after a dump starts are outside that dump. Pausing the three jobs is a production change and needs a separate approval.

## What a dump includes

`scripts/recovery/backup-production.ps1` uses `postgres:17.6` `pg_dump` / `pg_dumpall`, matching the server major version. It does not rely on an uninspected CLI default.

The Supabase CLI schema dump, as of CLI source commit `46648500`, excludes managed schemas including `auth`, `storage`, `cron`, `vault`, `extensions`, `realtime`, and `supabase_migrations`. Its data dump includes `auth`, `storage`, and `cron`, and still excludes `vault`. This script is explicit instead:

| File | Contents |
| --- | --- |
| `app-consistent.sql` | One snapshot of `public` and `private` schema and data |
| `schema-app.sql` / `data-app.sql` | Same objects, split. These are later snapshots than `app-consistent.sql`. |
| `roles.sql` | Roles, without passwords |
| `data-auth.sql` | `auth` data, including password hashes. Secret. |
| `auth-user-ids.txt` | User ids only, for linkage checks. Not for git. |
| `auth-user-created-trigger.sql` | `on_auth_user_created` → `public.handle_new_user()`. The default CLI schema dump omits this trigger. |
| `data-cron.sql` | Cron job rows |
| `data-storage.sql` | Storage metadata except `storage.buckets_vectors` and `storage.vector_indexes` |
| `data-migrations.sql` | `supabase_migrations.schema_migrations` (4 recorded CLI migrations; numbered `supabase/*.sql` files are not all in that table) |
| `manifest.json` | Counts, checksums, host, commit. No password and no row contents. |

Not included:

- Vault and `pgsodium` key material
- Storage file bytes (none exist today; a database dump would not contain them if they did)
- Vercel environment variables and the service-role key
- Role passwords
- A guarantee that `roles.sql`, `data-auth.sql`, and `app-consistent.sql` are one shared transaction

`private` has functions and no tables. `public` policies at inspection: 46. Sequences of interest: `public.user_roles_id_seq`, `auth.refresh_tokens_id_seq`.

## Owner steps to create the backup

Do not paste the database URL or password into chat. Do not reset the database password unless the current password is unknown. A reset does not by itself redeploy the website, because the app connects with API keys, but it invalidates every existing direct database connection.

Docker Desktop is required and was running when this section was last updated. The recovery database uses port **55432** on **127.0.0.1** only. It does not use the other project's container, volume, or network. That project's Postgres is `footbalbettingplatform-postgres-1` on `127.0.0.1:5433`.

1. In the Supabase dashboard for project `xzlirjwzpmvugkbhtzxw`, open Connect and read the **Session pooler** host, user, and database password. Port must be **5432**. If the host is not `aws-0-eu-west-1.pooler.supabase.com`, change the host field in the dialog. Direct host `db.xzlirjwzpmvugkbhtzxw.supabase.co` with user `postgres` is also accepted.
2. Run this command. A masked dialog opens. The password is saved with Windows DPAPI for the current user, outside Git, and is not printed.

```powershell
powershell -NoProfile -STA -ExecutionPolicy Bypass -File C:\Users\User\Desktop\pilateswebsite\scripts\recovery\save-backup-credentials.ps1
```

3. After the window prints `CREDENTIALS_SAVED`, tell the agent to continue. The backup command is:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\User\Desktop\pilateswebsite\scripts\recovery\backup-production.ps1
```

The script writes a new timestamped directory under `%USERPROFILE%\pilates-recovery`. A second copy under `%USERPROFILE%\Documents\pilates-recovery-copies` contains AES-256-CBC ciphertext only. The decryption key is a separate DPAPI file under `%USERPROFILE%\pilates-recovery-keys`. Both copies are on this PC. Neither is an off-machine copy. Do not upload them unless a destination has been confirmed.

4. The rehearsal, after the backup exists:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\User\Desktop\pilateswebsite\scripts\recovery\restore-rehearsal.ps1 -BackupDir 'C:\Users\User\pilates-recovery\production-...' -ConfirmDisposable
```

The rehearsal loads personal data into `pilates-recovery-rehearsal` on `127.0.0.1:55432`. It has no production credentials, email, webhooks, or `pg_cron`. Leave that container in place until a later pass decides whether to reuse it.

Pass 1 is complete only after the backup directory exists, plaintext and ciphertext checksums match, and the rehearsal report shows matching row counts, relationship checks, function names, policy count, and `user_roles_id_seq`. That rehearsal is not a full Supabase project restore. Record `DURATION_SECONDS`.

Take another backup immediately before a later production migration. Do not reuse this one as the pre-deploy recovery point.

## Fast disable

The payment and Not attended mutations do not exist yet. Until they ship, they stay disabled because there is no deployed operation.

When they ship, the database functions must read a server-side gate, `private.feature_gates`, and reject the call when the gate is off. Hiding a button is not the control. The owner disable, after that migration exists, is a SQL update performed in the dashboard:

```sql
update private.feature_gates
set enabled = false, updated_at = now()
where feature_key in ('package_payment_mutations', 'not_attended_replacement');
```

That statement is not valid today. The table is part of the feature migration, which must not be applied before this backup gate passes.

## Destructive production restore

A full restore is downtime. Supabase takes the project offline, replaces it from a dashboard backup or PITR point, and then the project comes back. Any booking, package, or profile write committed after that restore point is gone and must be reconciled by hand. There is no instant lossless rollback once writers have continued.

Do not run a restore from these scripts. `restore-rehearsal.ps1` rejects every host except localhost and rejects ports 5432 and 6543.

A production restore requires all of the following:

1. A named person approves the restore in writing, including the restore point and the fact that later writes will be lost.
2. The owner starts it from Database → Backups, or from PITR if that add-on is enabled. This account has not confirmed whether the project is on a plan that keeps downloadable daily backups. Official docs: Free projects are expected to keep their own logical dumps; Pro keeps 7 daily backups; PITR is a paid add-on and replaces daily logical downloads.
3. During downtime, leave the three cron jobs paused until the restored schema and the deployed application match.
4. After restore, reset any custom role passwords. This dump stores none. Auth user password hashes are in `data-auth.sql` only when that file is the source of the restore.
5. Confirm Vercel env vars separately. They are not in the database backup.
6. Do not drop new payment or replacement tables as a shortcut. Disable the feature gate first and keep the rows for reconciliation.

Platform restore and a logical replay are different tools. Dashboard restore returns the managed project, including auth, if the platform backup exists. The logical rehearsal proves we can read back `public` and `private`. It does not prove a one-click Supabase project restore, and it does not restore GoTrue, Storage files, or Vault.
