# Logical backup of the Corehouse production database.
# Reads DPAPI credentials saved by save-backup-credentials.ps1.
# Does not print the password. Writes only outside the git repository.
# See docs/general/payment-feature-recovery-runbook.md.

[CmdletBinding()]
param(
  [string]$OutRoot = (Join-Path $env:USERPROFILE 'pilates-recovery'),
  [string]$SecondCopyRoot = (Join-Path $env:USERPROFILE 'Documents\pilates-recovery-copies'),
  [string]$PostgresImage = 'postgres:17.6',
  [string]$ExpectedProjectRef = 'xzlirjwzpmvugkbhtzxw'
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'recovery-common.ps1')

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Assert-OutsideRepository -Path $OutRoot -RepositoryRoot $repoRoot
Assert-OutsideRepository -Path $SecondCopyRoot -RepositoryRoot $repoRoot
Assert-OutsideRepository -Path (Split-Path (Get-BackupKeyPath) -Parent) -RepositoryRoot $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker is not installed.'
}
& docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker engine is not running.' }

$foreignBefore = @(Get-ForeignContainerIds)
$pg = Read-ProductionConnection -ExpectedProjectRef $ExpectedProjectRef
$secondDir = $null
$holderName = 'pilates-recovery-snapshot-hold'
$holderId = $null
Assert-PilatesRecoveryName -Name $holderName
$existingHolder = @(docker ps -aq --filter "name=^/${holderName}$")
if ($existingHolder.Count -gt 0) {
  throw "Refusing to reuse existing container $holderName."
}

$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
$backupDir = Join-Path $OutRoot ("production-{0}-{1}" -f $ExpectedProjectRef, $stamp)
if (Test-Path $backupDir) { throw "Refusing to overwrite an existing backup directory: $backupDir" }
New-Item -ItemType Directory -Path $backupDir | Out-Null
Protect-PrivateDirectory -Path $backupDir

$envFile = Join-Path $backupDir '.pg-env'
try {
  Write-PgEnvFile -Path $envFile -Connection $pg
  Protect-PrivateDirectory -Path $envFile

  Write-Host "Pulling $PostgresImage if needed..."
  & docker pull $PostgresImage
  if ($LASTEXITCODE -ne 0) { throw "docker pull $PostgresImage failed." }
  $pgDumpVersion = (& docker run --rm --entrypoint pg_dump $PostgresImage --version).Trim()
  $dockerVersion = (& docker version --format '{{.Server.Version}}').Trim()

  $holdScript = @'
#!/bin/bash
set -eu
rm -f /backup/snapshot.id /backup/snapshot.done
coproc PG { psql -v ON_ERROR_STOP=1 -Atq; }
echo "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;" >&"${PG[1]}"
echo "SELECT pg_export_snapshot();" >&"${PG[1]}"
IFS= read -r SNAP <&"${PG[0]}"
printf '%s\n' "$SNAP" > /backup/snapshot.id
while [ ! -f /backup/snapshot.done ]; do sleep 1; done
echo "COMMIT;" >&"${PG[1]}"
echo '\q' >&"${PG[1]}"
wait || true
'@
  $holdPath = Join-Path $backupDir 'hold-snapshot.sh'
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($holdPath, ($holdScript -replace "`r`n", "`n"), $utf8)

  $holderId = (& docker run -d --name $holderName --network bridge --tmpfs /var/lib/postgresql/data --env-file $envFile -v "${backupDir}:/backup" --entrypoint bash $PostgresImage /backup/hold-snapshot.sh).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $holderId) { throw 'Could not start the snapshot session.' }

  $snapshotId = $null
  for ($i = 0; $i -lt 45; $i++) {
    if (Test-Path (Join-Path $backupDir 'snapshot.id')) {
      $snapshotId = (Get-Content -Raw (Join-Path $backupDir 'snapshot.id')).Trim()
      if ($snapshotId) { break }
    }
    $running = docker ps -q --filter "id=$holderId"
    if (-not $running) { throw 'Snapshot session exited before it exported a snapshot.' }
    Start-Sleep -Seconds 1
  }
  if (-not $snapshotId -or $snapshotId -notmatch '^[0-9A-Fa-f-]+$') {
    throw 'Did not receive a valid exported snapshot id.'
  }

  $dumpArgs = @('--format=plain', '--no-owner', "--snapshot=$snapshotId")
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'roles.sql' -PgDumpAll -ExtraArgs @('--roles-only', '--no-role-passwords')
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'app-consistent.sql' -ExtraArgs (@('--schema=public', '--schema=private') + $dumpArgs)
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'schema-app.sql' -ExtraArgs (@('--schema-only', '--schema=public', '--schema=private') + $dumpArgs)
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'data-app.sql' -ExtraArgs (@('--data-only', '--schema=public', '--schema=private') + $dumpArgs)
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'data-auth.sql' -ExtraArgs (@('--data-only', '--schema=auth') + $dumpArgs)
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'data-cron.sql' -ExtraArgs (@('--data-only', '--schema=cron') + $dumpArgs)
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'data-storage.sql' -ExtraArgs (@(
      '--data-only', '--schema=storage',
      '--exclude-table=storage.buckets_vectors',
      '--exclude-table=storage.vector_indexes'
    ) + $dumpArgs)
  Invoke-PgDump -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -FileName 'data-migrations.sql' -ExtraArgs (@('--data-only', '--table=supabase_migrations.schema_migrations') + $dumpArgs)

  $captureSql = @"
\pset pager off
BEGIN ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION SNAPSHOT '$snapshotId';
\copy (select id::text from auth.users order by id) to '/backup/auth-user-ids.txt'
\copy (select pg_get_triggerdef(t.oid, true) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'auth' and t.tgname = 'on_auth_user_created' and not t.tgisinternal) to '/backup/auth-user-created-trigger.sql'
CREATE TEMP TABLE row_counts(line text);
DO `$`$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY 1
  LOOP
    EXECUTE format(
      'INSERT INTO row_counts SELECT %L || ''='' || count(*)::text FROM public.%I',
      r.relname,
      r.relname
    );
  END LOOP;
END `$`$;
\copy (select line from row_counts order by line) to '/backup/public-row-counts.txt'
\copy (select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private') order by 1) to '/backup/function-names.txt'
\copy (select count(*)::text from pg_policy pol join pg_class c on c.oid = pol.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public') to '/backup/public-policy-count.txt'
\copy (select last_value::text from public.user_roles_id_seq) to '/backup/user-roles-seq.txt'
CREATE TEMP TABLE consistency(line text);
INSERT INTO consistency SELECT 'public_indexes=' || count(*)::text FROM pg_indexes WHERE schemaname = 'public';
INSERT INTO consistency SELECT 'public_constraints=' || count(*)::text FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public';
INSERT INTO consistency SELECT 'public_grants=' || count(*)::text FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','service_role');
INSERT INTO consistency SELECT 'bookings_missing_session=' || count(*)::text FROM public.bookings b WHERE NOT EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = b.session_id);
INSERT INTO consistency SELECT 'charges_missing_booking=' || count(*)::text FROM public.booking_credit_charges c WHERE NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = c.booking_id);
INSERT INTO consistency SELECT 'charges_missing_package=' || count(*)::text FROM public.booking_credit_charges c WHERE c.user_package_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_packages up WHERE up.id = c.user_package_id);
INSERT INTO consistency SELECT 'packages_missing_profile=' || count(*)::text FROM public.user_packages up WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = up.user_id);
INSERT INTO consistency SELECT 'bookings_missing_profile=' || count(*)::text FROM public.bookings b WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = b.user_id);
INSERT INTO consistency SELECT 'logs_missing_rule=' || count(*)::text FROM public.recurring_prebook_materialization_log l WHERE l.rule_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.recurring_prebook_rules r WHERE r.id = l.rule_id);
INSERT INTO consistency SELECT 'bookings_joined_sessions=' || count(*)::text FROM public.bookings b JOIN public.sessions s ON s.id = b.session_id;
\copy (select line from consistency order by line) to '/backup/consistency-checks.txt'
COMMIT;
"@
  Set-Content -Path (Join-Path $backupDir 'capture.sql') -Value $captureSql -Encoding ascii
  Invoke-PsqlFile -Image $PostgresImage -EnvFile $envFile -BackupDir $backupDir -SqlFileName 'capture.sql'

  New-Item -ItemType File -Path (Join-Path $backupDir 'snapshot.done') | Out-Null
  & docker wait $holderId | Out-Null

  $schemaText = Get-Content -Raw -Path (Join-Path $backupDir 'schema-app.sql')
  foreach ($required in @('private', 'book_session_core', 'handle_user_package_status', 'finalize_past_bookings', 'cancel_booking', 'CREATE POLICY', 'GRANT ')) {
    if ($schemaText -notmatch [regex]::Escape($required)) {
      throw "schema-app.sql is missing required content: $required"
    }
  }
  $authText = Get-Content -Raw -Path (Join-Path $backupDir 'data-auth.sql')
  if ($authText -notmatch 'auth\.users' -and $authText -notmatch 'auth"."users') {
    throw 'data-auth.sql does not contain auth.users. Auth linkage was not exported.'
  }
  $passwordFound = Select-String -Path (Join-Path $backupDir '*.sql'), (Join-Path $backupDir '*.txt') -Pattern ([regex]::Escape($pg.Password)) -SimpleMatch -Quiet
  if ($passwordFound) { throw 'A backup file contains the database password. Refusing to keep this export.' }

  $files = @(
    'roles.sql', 'app-consistent.sql', 'schema-app.sql', 'data-app.sql', 'data-auth.sql',
    'data-cron.sql', 'data-storage.sql', 'data-migrations.sql', 'auth-user-ids.txt',
    'auth-user-created-trigger.sql', 'public-row-counts.txt', 'function-names.txt',
    'public-policy-count.txt', 'user-roles-seq.txt', 'consistency-checks.txt'
  )
  $checksums = @()
  foreach ($name in $files) {
    $path = Join-Path $backupDir $name
    if (-not (Test-Path $path)) { throw "Missing backup file $name" }
    $item = Get-Item $path
    if ($item.Length -le 0) { throw "Backup file is empty: $name" }
    $hash = Get-FileHash -Algorithm SHA256 -Path $path
    $checksums += [ordered]@{ name = $name; bytes = $item.Length; sha256 = $hash.Hash.ToLowerInvariant() }
  }

  $rowCounts = @{}
  Get-Content (Join-Path $backupDir 'public-row-counts.txt') | ForEach-Object {
    $parts = $_.Split('=', 2)
    if ($parts.Count -eq 2) { $rowCounts[$parts[0]] = [int]$parts[1] }
  }
  $authIdCount = @(Get-Content (Join-Path $backupDir 'auth-user-ids.txt') | Where-Object { $_.Trim() -ne '' }).Count
  $profileCount = $rowCounts['profiles']
  if ($null -eq $profileCount) { throw 'profiles were not counted.' }
  if ($authIdCount -ne $profileCount) {
    throw "Auth/profile linkage mismatch inside the snapshot: auth.users=$authIdCount profiles=$profileCount"
  }

  Remove-Item -Force $envFile, $holdPath, (Join-Path $backupDir 'snapshot.id'), (Join-Path $backupDir 'snapshot.done'), (Join-Path $backupDir 'capture.sql')
  $envFile = $null

  $cipher = New-BackupCipher
  $keyPath = Get-BackupKeyPath
  if (Test-Path $keyPath) { throw "Refusing to overwrite the existing backup key: $keyPath" }
  Save-BackupCipher -Cipher $cipher -Path $keyPath
  $secondDir = Join-Path $SecondCopyRoot (Split-Path $backupDir -Leaf)
  if (Test-Path $secondDir) { throw "Refusing to overwrite second copy: $secondDir" }
  New-Item -ItemType Directory -Path $secondDir | Out-Null
  Protect-PrivateDirectory -Path $secondDir
  $encryptedChecksums = @()
  foreach ($name in $files) {
    $source = Join-Path $backupDir $name
    $dest = Join-Path $secondDir ($name + '.enc')
    ConvertTo-EncryptedBackupFile -Source $source -Destination $dest -Cipher $cipher
    $hash = (Get-FileHash -Algorithm SHA256 -Path $dest).Hash.ToLowerInvariant()
    $again = (Get-FileHash -Algorithm SHA256 -Path $dest).Hash.ToLowerInvariant()
    if ($hash -ne $again) { throw "Checksum changed while reading $dest" }
    $encryptedChecksums += [ordered]@{ name = ($name + '.enc'); bytes = (Get-Item $dest).Length; sha256 = $hash }
  }

  $sameVolume = ((Get-Item $backupDir).PSDrive.Name -eq (Get-Item $secondDir).PSDrive.Name)
  $manifest = [ordered]@{
    created_at_utc = [DateTime]::UtcNow.ToString('o')
    project_ref = $ExpectedProjectRef
    database_host = $pg.Host
    database_port = $pg.Port
    database_user = $pg.User
    database_name = $pg.Database
    postgres_image = $PostgresImage
    pg_dump_version = $pgDumpVersion
    docker_server_version = $dockerVersion
    git_commit = (& git -C $repoRoot rev-parse HEAD).Trim()
    snapshot_id_present = $true
    snapshot_method = 'One repeatable-read snapshot was exported with pg_export_snapshot and reused for public, private, auth, cron, storage, migration data, counts, and relationship checks. The role dump has no snapshot and contains no passwords. Cron jobs were not paused. Commits after the snapshot start are outside this recovery point.'
    active_cron_jobs = @(
      'expire-packages-daily 0 2 * * *',
      'materialize-recurring-prebooks-daily 0 4 * * *',
      'finalize-past-bookings-hourly 15 * * * *'
    )
    included = @(
      'roles without passwords',
      'public and private schema and data from one snapshot',
      'auth data, including password hashes, from that snapshot',
      'auth.users ids and on_auth_user_created trigger',
      'cron data and storage metadata from that snapshot',
      'supabase_migrations.schema_migrations data'
    )
    excluded = @(
      'vault and pgsodium key material',
      'extensions, realtime, pgbouncer, graphql, graphql_public, etl, _analytics, _realtime, _supavisor schemas',
      'role passwords',
      'Storage API file bytes',
      'Vercel environment variables and API keys',
      'managed auth schema DDL other than the captured on_auth_user_created trigger'
    )
    row_counts = $rowCounts
    auth_user_id_count = $authIdCount
    profile_count = $profileCount
    files = $checksums
    encrypted_second_copy_directory = $secondDir
    encrypted_files = $encryptedChecksums
    decryption_key_path = $keyPath
    decryption_key_storage = 'Windows DPAPI CurrentUser, outside the backup directories and outside Git'
    second_copy_same_volume = $sameVolume
    off_machine_copy = $false
    encrypted = $true
    encryption = 'AES-256-CBC with HMAC-SHA256. The key is not stored beside either copy.'
    independent_copy_complete = $false
    independent_copy_note = 'The encrypted copy is on the same computer as the plaintext backup. It is not an independent off-machine copy until the owner chooses a destination.'
  }
  $manifestPath = Join-Path $backupDir 'manifest.json'
  $manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding utf8
  Copy-Item $manifestPath (Join-Path $secondDir 'manifest.json')
  $manifestHash = (Get-FileHash -Algorithm SHA256 -Path (Join-Path $secondDir 'manifest.json')).Hash.ToLowerInvariant()
  $manifestHashAgain = (Get-FileHash -Algorithm SHA256 -Path (Join-Path $secondDir 'manifest.json')).Hash.ToLowerInvariant()
  if ($manifestHash -ne $manifestHashAgain) { throw 'Second-copy manifest checksum changed.' }

  Assert-ForeignContainersUnchanged -Before $foreignBefore
  Write-Host "BACKUP_DIR=$backupDir"
  Write-Host "ENCRYPTED_COPY=$secondDir"
  Write-Host "SAME_VOLUME=$sameVolume"
  Write-Host "OFF_MACHINE_COPY=false"
  Write-Host "PG_DUMP=$pgDumpVersion"
}
finally {
  if ($envFile -and (Test-Path -LiteralPath $envFile)) { Remove-Item -Force -LiteralPath $envFile }
  if ($holderId) {
    Assert-PilatesRecoveryName -Name $holderName
    $still = @(docker ps -aq --filter "id=$holderId")
    if ($still.Count -gt 0) {
      $holderNames = @(docker ps -a --filter "id=$holderId" --format '{{.Names}}')
      if ($holderNames.Count -ne 1 -or $holderNames[0] -ne $holderName) {
        throw 'Refusing to remove a container that is not the Pilates snapshot holder.'
      }
      & docker rm -f $holderId | Out-Null
    }
  }
  if ($secondDir) {
    $secondEnv = Join-Path $secondDir '.pg-env'
    if (Test-Path -LiteralPath $secondEnv) { Remove-Item -Force -LiteralPath $secondEnv }
  }
  Assert-ForeignContainersUnchanged -Before $foreignBefore
}
