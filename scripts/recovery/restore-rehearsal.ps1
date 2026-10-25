# Restore a production logical backup into a disposable local Postgres container.
# This script refuses any Supabase host. It does not change production.
# See docs/general/payment-feature-recovery-runbook.md.

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$BackupDir,
  [string]$PostgresImage = 'postgres:17.6',
  [int]$LocalPort = 55432,
  [switch]$ConfirmDisposable
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'recovery-common.ps1')

if (-not $ConfirmDisposable) {
  throw 'Pass -ConfirmDisposable. This creates a local throwaway database and loads a copy of production personal data onto this machine.'
}

Assert-LocalRestoreTarget -HostName '127.0.0.1' -Port $LocalPort
$BackupDir = (Resolve-Path $BackupDir).Path
$manifestPath = Join-Path $BackupDir 'manifest.json'
if (-not (Test-Path $manifestPath)) { throw "manifest.json not found in $BackupDir" }
$manifest = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json

foreach ($file in @('app-consistent.sql', 'auth-user-ids.txt', 'public-row-counts.txt', 'function-names.txt', 'public-policy-count.txt', 'user-roles-seq.txt', 'consistency-checks.txt')) {
  $path = Join-Path $BackupDir $file
  if (-not (Test-Path $path)) { throw "Missing $file" }
  $actual = (Get-FileHash -Algorithm SHA256 -Path $path).Hash.ToLowerInvariant()
  $expected = @($manifest.files | Where-Object { $_.name -eq $file } | Select-Object -First 1).sha256
  if (-not $expected) { throw "manifest has no checksum for $file" }
  if ($actual -ne $expected) { throw "Checksum mismatch for $file. Refusing to restore a damaged backup." }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker is not installed.' }
& docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker engine is not running.' }

$container = 'pilates-recovery-rehearsal'
$volume = 'pilates-recovery-pgdata'
Assert-PilatesRecoveryName -Name $container
$foreignBefore = @(Get-ForeignContainerIds)
$existing = @(docker ps -aq --filter "name=^/${container}$")
if ($existing.Count -gt 0) {
  throw "Container $container already exists. It was left in place."
}
$listeners = netstat -ano | Select-String -Pattern ":$LocalPort\s+\S+\s+LISTENING"
if ($listeners) { throw "Local port $LocalPort is already in use." }

$started = [DateTime]::UtcNow
$localPassword = [Guid]::NewGuid().ToString('N')
& docker pull $PostgresImage
if ($LASTEXITCODE -ne 0) { throw "docker pull $PostgresImage failed." }
$volumeExists = @(docker volume ls --format '{{.Name}}' | Where-Object { $_ -eq $volume })
if ($volumeExists.Count -eq 0) {
  & docker volume create $volume | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Could not create volume $volume" }
}

& docker run -d --name $container --network bridge `
  -e POSTGRES_PASSWORD=$localPassword `
  -e POSTGRES_DB=rehearsal `
  -p "127.0.0.1:${LocalPort}:5432" `
  -v "${volume}:/var/lib/postgresql/data" `
  $PostgresImage | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not start the local rehearsal container.' }
$createdId = (docker ps -aq --filter "name=^/${container}$").Trim()
$envLines = @(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' $container)
foreach ($line in $envLines) {
  if ($line -like '*supabase.co*') { throw 'Rehearsal container received a production host.' }
}
$bindings = docker inspect --format '{{json .HostConfig.PortBindings}}' $container
if ($bindings -notlike '*127.0.0.1*') { throw 'Rehearsal port is not bound to 127.0.0.1.' }
if ($bindings -like '*0.0.0.0*') { throw 'Rehearsal port is exposed on all interfaces.' }

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  & docker exec $container pg_isready -h 127.0.0.1 -U postgres -d rehearsal | Out-Null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) {
  throw "Local Postgres did not become ready. Inspect with: docker logs $container"
}

$workDir = Join-Path $env:TEMP ("pilates-rehearsal-" + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ'))
New-Item -ItemType Directory -Path $workDir | Out-Null
$schemaCopy = Join-Path $workDir 'app-consistent.sql'
$schemaLines = New-Object System.Collections.Generic.List[string]
$schemaLines.Add('SET check_function_bodies = off;')
$schemaLines.Add('SET session_replication_role = replica;')
Get-Content (Join-Path $BackupDir 'app-consistent.sql') | ForEach-Object {
  if ($_ -ne 'CREATE SCHEMA public;') { $schemaLines.Add($_) }
}
[System.IO.File]::WriteAllLines($schemaCopy, $schemaLines.ToArray())

$preamble = @'
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT NULL::text $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN CREATE ROLE supabase_admin NOLOGIN; END IF;
END $$;
SET check_function_bodies = off;
'@
Set-Content -Path (Join-Path $workDir 'preamble.sql') -Value $preamble -Encoding ascii
Copy-Item (Join-Path $BackupDir 'auth-user-ids.txt') (Join-Path $workDir 'auth-user-ids.txt')

$loadIds = @'
CREATE TEMP TABLE auth_id_load (id uuid);
\copy auth_id_load(id) from '/work/auth-user-ids.txt'
INSERT INTO auth.users (id) SELECT id FROM auth_id_load ON CONFLICT DO NOTHING;
'@
Set-Content -Path (Join-Path $workDir 'load-auth-ids.sql') -Value $loadIds -Encoding ascii

$verifySql = @'
\pset pager off
CREATE TEMP TABLE row_counts(line text);
DO $$
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
END $$;
\copy (select line from row_counts order by line) to '/work/restored-row-counts.txt'
\copy (select count(*)::text from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id)) to '/work/profiles-without-auth.txt'
\copy (select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private') order by 1) to '/work/restored-function-names.txt'
\copy (select count(*)::text from pg_policy pol join pg_class c on c.oid = pol.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public') to '/work/public-policy-count.txt'
\copy (select last_value::text from public.user_roles_id_seq) to '/work/user-roles-seq.txt'
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
\copy (select line from consistency order by line) to '/work/restored-consistency.txt'
\copy (select count(*)::text from pg_extension where extname = 'pg_cron') to '/work/pg-cron-installed.txt'
\copy (select count(*)::text from pg_foreign_server) to '/work/foreign-servers.txt'
'@
Set-Content -Path (Join-Path $workDir 'verify.sql') -Value $verifySql -Encoding ascii

function Invoke-LocalPsql {
  param([Parameter(Mandatory = $true)][string]$FileName)
  & docker run --rm --network container:$container -v "${workDir}:/work" -e PGPASSWORD=$localPassword -e PGSSLMODE=disable $PostgresImage `
    psql --set ON_ERROR_STOP=1 --host 127.0.0.1 --port 5432 --username postgres --dbname rehearsal --file "/work/$FileName"
  if ($LASTEXITCODE -ne 0) { throw "Local psql failed on $FileName" }
}

try {
  Invoke-LocalPsql -FileName 'preamble.sql'
  Invoke-LocalPsql -FileName 'load-auth-ids.sql'
  & docker run --rm --network container:$container -v "${workDir}:/work" -e PGPASSWORD=$localPassword -e PGSSLMODE=disable $PostgresImage `
    psql --set ON_ERROR_STOP=1 --host 127.0.0.1 --port 5432 --username postgres --dbname rehearsal --file /work/app-consistent.sql
  if ($LASTEXITCODE -ne 0) { throw 'Application schema and data restore failed.' }
  Invoke-LocalPsql -FileName 'verify.sql'

  $expectedCounts = @{}
  Get-Content (Join-Path $BackupDir 'public-row-counts.txt') | ForEach-Object {
    $parts = $_.Split('=', 2)
    if ($parts.Count -eq 2) { $expectedCounts[$parts[0]] = $parts[1] }
  }
  $actualCounts = @{}
  Get-Content (Join-Path $workDir 'restored-row-counts.txt') | ForEach-Object {
    $parts = $_.Split('=', 2)
    if ($parts.Count -eq 2) { $actualCounts[$parts[0]] = $parts[1] }
  }
  $mismatches = @()
  foreach ($key in $expectedCounts.Keys) {
    if ($actualCounts[$key] -ne $expectedCounts[$key]) {
      $mismatches += "$key expected $($expectedCounts[$key]) got $($actualCounts[$key])"
    }
  }
  $orphanProfiles = (Get-Content (Join-Path $workDir 'profiles-without-auth.txt') | Select-Object -First 1).Trim()
  $expectedFunctions = @(Get-Content (Join-Path $BackupDir 'function-names.txt') | Where-Object { $_.Trim() -ne '' })
  $actualFunctions = @(Get-Content (Join-Path $workDir 'restored-function-names.txt') | Where-Object { $_.Trim() -ne '' })
  $functionDelta = @(Compare-Object -ReferenceObject $expectedFunctions -DifferenceObject $actualFunctions)
  $requiredPrivate = @('private.is_owner', 'private.is_admin', 'private.is_staff', 'private.is_instructor', 'private.book_session_core')
  $missingPrivate = @($requiredPrivate | Where-Object { $actualFunctions -notcontains $_ })
  $policyCount = (Get-Content (Join-Path $workDir 'public-policy-count.txt') | Select-Object -First 1).Trim()
  $expectedPolicies = (Get-Content (Join-Path $BackupDir 'public-policy-count.txt') | Select-Object -First 1).Trim()
  $sequenceValue = (Get-Content (Join-Path $workDir 'user-roles-seq.txt') | Select-Object -First 1).Trim()
  $expectedSequence = (Get-Content (Join-Path $BackupDir 'user-roles-seq.txt') | Select-Object -First 1).Trim()
  $expectedConsistency = @(Get-Content (Join-Path $BackupDir 'consistency-checks.txt'))
  $actualConsistency = @(Get-Content (Join-Path $workDir 'restored-consistency.txt'))
  $consistencyDelta = @(Compare-Object -ReferenceObject $expectedConsistency -DifferenceObject $actualConsistency)
  $cronInstalled = (Get-Content (Join-Path $workDir 'pg-cron-installed.txt') | Select-Object -First 1).Trim()
  $foreignServers = (Get-Content (Join-Path $workDir 'foreign-servers.txt') | Select-Object -First 1).Trim()
  $elapsed = [DateTime]::UtcNow - $started
  $localSecretPath = Join-Path (Split-Path (Get-BackupKeyPath) -Parent) 'rehearsal-local.dpapi'
  $keyDirectory = Split-Path $localSecretPath -Parent
  if (-not (Test-Path $keyDirectory)) { New-Item -ItemType Directory -Path $keyDirectory | Out-Null }
  Protect-PrivateDirectory -Path $keyDirectory
  $localPayload = @{ container = $container; port = $LocalPort; database = 'rehearsal'; user = 'postgres'; password = $localPassword } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllBytes($localSecretPath, (Protect-BytesForCurrentUser -Bytes ([System.Text.Encoding]::UTF8.GetBytes($localPayload))))
  Protect-PrivateDirectory -Path $localSecretPath
  $localPassword = $null

  $report = [ordered]@{
    restored_at_utc = [DateTime]::UtcNow.ToString('o')
    duration_seconds = [math]::Round($elapsed.TotalSeconds, 1)
    backup_dir = $BackupDir
    container = $container
    volume = $volume
    local_port = $LocalPort
    bound_address = '127.0.0.1'
    row_count_mismatches = $mismatches
    consistency_mismatches = @($consistencyDelta | ForEach-Object { $_.InputObject })
    function_mismatches = @($functionDelta | ForEach-Object { $_.InputObject })
    missing_private_functions = $missingPrivate
    profiles_without_auth = $orphanProfiles
    public_policy_count = $policyCount
    user_roles_id_seq_last_value = $sequenceValue
    pg_cron_installed = $cronInstalled
    foreign_servers = $foreignServers
    production_connection_used = $false
    full_production_recovery = $false
    limitations = @(
      'This is a business-schema rehearsal on vanilla Postgres 17.6, not a Supabase project restore.',
      'GoTrue, auth sessions, Storage API, Vault, edge functions, and Vercel configuration were not restored.',
      'pg_cron is not installed here, so the restored environment cannot run production jobs or contact production.',
      'session_replication_role=replica skips triggers during data load. Counts, grants, indexes, constraints, and foreign keys to the auth id stub are checked afterwards.',
      'check_function_bodies is off, so function bodies are stored but were not executed.',
      'The container is left running on 127.0.0.1 for later isolated tests. It is not a production rollback.'
    )
  }
  $reportPath = Join-Path $BackupDir 'restore-rehearsal-report.json'
  $report | ConvertTo-Json -Depth 6 | Set-Content -Path $reportPath -Encoding utf8
  Assert-ForeignContainersUnchanged -Before $foreignBefore
  Write-Host "RESTORE_REPORT=$reportPath"
  Write-Host "DURATION_SECONDS=$($report.duration_seconds)"
  Write-Host "MISMATCHES=$($mismatches.Count)"
  Write-Host "CONSISTENCY_MISMATCHES=$($consistencyDelta.Count)"
  Write-Host "FUNCTION_MISMATCHES=$($functionDelta.Count)"
  Write-Host "PROFILES_WITHOUT_AUTH=$orphanProfiles"
  Write-Host "PUBLIC_POLICIES=$policyCount"
  Write-Host "PG_CRON=$cronInstalled"
  if ($mismatches.Count -gt 0 -or $consistencyDelta.Count -gt 0 -or $functionDelta.Count -gt 0 -or $missingPrivate.Count -gt 0 -or $orphanProfiles -ne '0' -or $policyCount -ne $expectedPolicies -or $sequenceValue -ne $expectedSequence -or $cronInstalled -ne '0' -or $foreignServers -ne '0') {
    throw "Restore rehearsal checks failed. mismatches=$($mismatches.Count) consistency=$($consistencyDelta.Count) functions=$($functionDelta.Count) orphan_profiles=$orphanProfiles policies=$policyCount/$expectedPolicies sequence=$sequenceValue/$expectedSequence cron=$cronInstalled foreign_servers=$foreignServers"
  }
  Write-Host 'Business-schema restore checks passed. This is not a full Supabase project restore.'
}
finally {
  Remove-Item -Recurse -Force $workDir -ErrorAction SilentlyContinue
  Assert-ForeignContainersUnchanged -Before $foreignBefore
}
