# Shared helpers for production backup and local restore rehearsal.
# Never print connection URLs, passwords, or auth dumps.

function Assert-OutsideRepository {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$RepositoryRoot
  )
  $full = [System.IO.Path]::GetFullPath($Path)
  $root = [System.IO.Path]::GetFullPath($RepositoryRoot)
  if (-not $root.EndsWith('\')) { $root = $root + '\' }
  if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to write recovery files inside the git repository: $full"
  }
}

function Protect-PrivateDirectory {
  param([Parameter(Mandatory = $true)][string]$Path)
  $identity = "$env:USERDOMAIN\$env:USERNAME"
  $isDirectory = (Get-Item -LiteralPath $Path).PSIsContainer
  $rights = $(if ($isDirectory) { '(OI)(CI)(F)' } else { '(F)' })
  & icacls $Path /inheritance:r /grant:r "${identity}:${rights}" "SYSTEM:${rights}" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Could not restrict ACLs on $Path"
  }
}

function Get-PostgresConnectionParts {
  param(
    [string]$DatabaseUrl,
    [Parameter(Mandatory = $true)][string]$ExpectedProjectRef
  )
  if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw 'SUPABASE_DB_URL is not set. Put the Session pooler URI in that environment variable. Do not paste it into chat.'
  }
  $uri = $null
  try { $uri = [Uri]$DatabaseUrl } catch { throw 'SUPABASE_DB_URL is not a valid URI.' }
  if ($uri.Scheme -ne 'postgresql' -and $uri.Scheme -ne 'postgres') {
    throw 'SUPABASE_DB_URL must start with postgresql://'
  }
  $allowedHosts = @(
    "db.$ExpectedProjectRef.supabase.co",
    'aws-0-eu-west-1.pooler.supabase.com',
    'aws-1-eu-west-1.pooler.supabase.com'
  )
  if ($allowedHosts -notcontains $uri.Host) {
    throw "Refusing host $($uri.Host). Use the production direct host or the eu-west-1 session pooler."
  }
  if ($uri.Port -eq 6543) {
    throw 'Port 6543 is the transaction pooler. pg_dump needs the session pooler on port 5432 or the direct database host.'
  }
  $userInfo = $uri.UserInfo
  $colon = $userInfo.IndexOf(':')
  if ($colon -lt 1) { throw 'SUPABASE_DB_URL must include a user and password.' }
  $user = [Uri]::UnescapeDataString($userInfo.Substring(0, $colon))
  $password = [Uri]::UnescapeDataString($userInfo.Substring($colon + 1))
  if ($user -notlike "*$ExpectedProjectRef*" -and $uri.Host -notlike "*$ExpectedProjectRef*") {
    throw 'Connection user/host does not match the expected production project ref.'
  }
  if ($uri.Host -like 'db.*' -and $user -ne 'postgres') {
    throw 'Direct connections must use the postgres user.'
  }
  if ($uri.Host -like '*.pooler.supabase.com' -and $user -ne "postgres.$ExpectedProjectRef") {
    throw 'Session pooler user must be postgres.<project-ref>.'
  }
  $database = $uri.AbsolutePath.TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($database)) { $database = 'postgres' }
  if ($password.Length -lt 8) { throw 'Database password looks too short.' }
  return [pscustomobject]@{
    Host = $uri.Host
    Port = $(if ($uri.Port -gt 0) { $uri.Port } else { 5432 })
    User = $user
    Password = $password
    Database = $database
  }
}

function Write-PgEnvFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)]$Connection
  )
  $lines = @(
    "PGHOST=$($Connection.Host)",
    "PGPORT=$($Connection.Port)",
    "PGUSER=$($Connection.User)",
    "PGPASSWORD=$($Connection.Password)",
    "PGDATABASE=$($Connection.Database)",
    'PGSSLMODE=require'
  )
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllLines($Path, $lines, $utf8)
}

function Invoke-PgTool {
  param(
    [Parameter(Mandatory = $true)][string]$Image,
    [Parameter(Mandatory = $true)][string]$EnvFile,
    [Parameter(Mandatory = $true)][string]$BackupDir,
    [Parameter(Mandatory = $true)][string[]]$Command
  )
  & docker run --rm --network bridge --env-file $EnvFile -v "${BackupDir}:/backup" $Image @Command
  if ($LASTEXITCODE -ne 0) {
    throw "docker $($Command -join ' ') failed with exit $LASTEXITCODE"
  }
}

function Invoke-PgDump {
  param(
    [Parameter(Mandatory = $true)][string]$Image,
    [Parameter(Mandatory = $true)][string]$EnvFile,
    [Parameter(Mandatory = $true)][string]$BackupDir,
    [Parameter(Mandatory = $true)][string]$FileName,
    [switch]$PgDumpAll,
    [string[]]$ExtraArgs
  )
  $tool = $(if ($PgDumpAll) { 'pg_dumpall' } else { 'pg_dump' })
  $command = @($tool) + $ExtraArgs + @("--file=/backup/$FileName")
  Invoke-PgTool -Image $Image -EnvFile $EnvFile -BackupDir $BackupDir -Command $command
}

function Invoke-PsqlFile {
  param(
    [Parameter(Mandatory = $true)][string]$Image,
    [Parameter(Mandatory = $true)][string]$EnvFile,
    [Parameter(Mandatory = $true)][string]$BackupDir,
    [Parameter(Mandatory = $true)][string]$SqlFileName
  )
  Invoke-PgTool -Image $Image -EnvFile $EnvFile -BackupDir $BackupDir -Command @(
    'psql', '--set', 'ON_ERROR_STOP=1', '--file', "/backup/$SqlFileName"
  )
}

function Get-ProductionCredentialPath {
  Join-Path $env:USERPROFILE 'pilates-recovery\credentials\production.dpapi'
}

function Get-BackupKeyPath {
  Join-Path $env:USERPROFILE 'pilates-recovery-keys\backup-aes.dpapi'
}

function Protect-BytesForCurrentUser {
  param([Parameter(Mandatory = $true)][byte[]]$Bytes)
  Add-Type -AssemblyName System.Security
  return [System.Security.Cryptography.ProtectedData]::Protect(
    $Bytes,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
}

function Unprotect-BytesForCurrentUser {
  param([Parameter(Mandatory = $true)][byte[]]$Bytes)
  Add-Type -AssemblyName System.Security
  return [System.Security.Cryptography.ProtectedData]::Unprotect(
    $Bytes,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
}

function Assert-ProductionConnection {
  param(
    [Parameter(Mandatory = $true)]$Connection,
    [Parameter(Mandatory = $true)][string]$ExpectedProjectRef
  )
  if ($Connection.Port -eq 6543) {
    throw 'Port 6543 is the transaction pooler. Use the session pooler on port 5432 or the direct database host.'
  }
  if ($Connection.Port -lt 1 -or $Connection.Port -gt 65535) {
    throw 'Database port is invalid.'
  }
  $directHost = "db.$ExpectedProjectRef.supabase.co"
  $poolerUser = "postgres.$ExpectedProjectRef"
  $hostAllowed = ($Connection.Host -eq $directHost) -or ($Connection.Host -like '*.pooler.supabase.com')
  if (-not $hostAllowed) {
    throw "Refusing host $($Connection.Host). Use the production direct host or the eu-west-1 session pooler."
  }
  if ($Connection.Host -eq $directHost -and $Connection.User -ne 'postgres') {
    throw 'Direct connections must use the postgres user.'
  }
  if ($Connection.Host -like '*.pooler.supabase.com' -and $Connection.User -ne $poolerUser) {
    throw 'Session pooler user must be postgres.<project-ref> for this production project.'
  }
  if ($Connection.Database -ne 'postgres') {
    throw 'Database name must be postgres.'
  }
  if ([string]::IsNullOrEmpty($Connection.Password) -or $Connection.Password.Length -lt 8) {
    throw 'Database password is missing or too short.'
  }
  if ($Connection.Password -match "[\r\n]") {
    throw 'Database password cannot contain a line break.'
  }
}

function Read-ProductionConnection {
  param([Parameter(Mandatory = $true)][string]$ExpectedProjectRef)
  $path = Get-ProductionCredentialPath
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Production credentials are not saved. Run scripts/recovery/save-backup-credentials.ps1 and enter the session-pooler details in the dialog. Do not paste them into chat."
  }
  $protected = [System.IO.File]::ReadAllBytes($path)
  $json = [System.Text.Encoding]::UTF8.GetString((Unprotect-BytesForCurrentUser -Bytes $protected))
  $raw = $json | ConvertFrom-Json
  $connection = [pscustomobject]@{
    Host = [string]$raw.host
    Port = [int]$raw.port
    User = [string]$raw.user
    Password = [string]$raw.password
    Database = [string]$raw.database
  }
  Assert-ProductionConnection -Connection $connection -ExpectedProjectRef $ExpectedProjectRef
  return $connection
}

function Assert-PilatesRecoveryName {
  param([Parameter(Mandatory = $true)][string]$Name)
  if ($Name -notmatch '^pilates-recovery-[a-z0-9-]{3,40}$') {
    throw "Refusing to manage Docker name '$Name'."
  }
}

function Get-ForeignContainerIds {
  @(docker ps -a --format '{{.Names}} {{.ID}}' | Where-Object { $_ -and ($_ -notmatch '^pilates-recovery-') })
}

function Assert-ForeignContainersUnchanged {
  param([Parameter(Mandatory = $true)][string[]]$Before)
  $after = @(Get-ForeignContainerIds)
  $beforeText = ($Before | Sort-Object) -join "`n"
  $afterText = ($after | Sort-Object) -join "`n"
  if ($beforeText -ne $afterText) {
    throw 'A container that does not belong to Pilates recovery changed. Stopping.'
  }
}

function New-BackupCipher {
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $aes = New-Object byte[] 32
  $hmac = New-Object byte[] 32
  $rng.GetBytes($aes)
  $rng.GetBytes($hmac)
  return [pscustomobject]@{ Aes = $aes; Hmac = $hmac }
}

function Save-BackupCipher {
  param(
    [Parameter(Mandatory = $true)]$Cipher,
    [Parameter(Mandatory = $true)][string]$Path
  )
  $directory = Split-Path $Path -Parent
  if (-not (Test-Path $directory)) { New-Item -ItemType Directory -Path $directory | Out-Null }
  Protect-PrivateDirectory -Path $directory
  $raw = New-Object byte[] 64
  [System.Buffer]::BlockCopy($Cipher.Aes, 0, $raw, 0, 32)
  [System.Buffer]::BlockCopy($Cipher.Hmac, 0, $raw, 32, 32)
  [System.IO.File]::WriteAllBytes($Path, (Protect-BytesForCurrentUser -Bytes $raw))
  Protect-PrivateDirectory -Path $Path
  [Array]::Clear($raw, 0, $raw.Length)
}

function Read-BackupCipher {
  param([Parameter(Mandatory = $true)][string]$Path)
  $raw = [byte[]](Unprotect-BytesForCurrentUser -Bytes ([byte[]]([System.IO.File]::ReadAllBytes($Path))))
  if ($raw.Length -ne 64) { throw 'Backup key file has an unexpected length.' }
  $aes = New-Object byte[] 32
  $hmac = New-Object byte[] 32
  [System.Buffer]::BlockCopy($raw, 0, $aes, 0, 32)
  [System.Buffer]::BlockCopy($raw, 32, $hmac, 0, 32)
  [Array]::Clear($raw, 0, $raw.Length)
  return [pscustomobject]@{ Aes = $aes; Hmac = $hmac }
}

function ConvertTo-EncryptedBackupFile {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination,
    [Parameter(Mandatory = $true)]$Cipher
  )
  $aesAlg = [System.Security.Cryptography.Aes]::Create()
  $aesAlg.KeySize = 256
  $aesAlg.Mode = [System.Security.Cryptography.CipherMode]::CBC
  $aesAlg.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
  $aesAlg.Key = $Cipher.Aes
  $aesAlg.GenerateIV()
  $plain = [System.IO.File]::ReadAllBytes($Source)
  $encryptor = $aesAlg.CreateEncryptor()
  $encrypted = $encryptor.TransformFinalBlock($plain, 0, $plain.Length)
  $macInput = New-Object byte[] ($aesAlg.IV.Length + $encrypted.Length)
  [System.Buffer]::BlockCopy($aesAlg.IV, 0, $macInput, 0, $aesAlg.IV.Length)
  [System.Buffer]::BlockCopy($encrypted, 0, $macInput, $aesAlg.IV.Length, $encrypted.Length)
  $hmacAlg = New-Object System.Security.Cryptography.HMACSHA256 (, $Cipher.Hmac)
  $mac = $hmacAlg.ComputeHash($macInput)
  $stream = [System.IO.File]::Create($Destination)
  try {
    $magic = [System.Text.Encoding]::ASCII.GetBytes('PRB1')
    $stream.Write($magic, 0, 4)
    $stream.Write($aesAlg.IV, 0, $aesAlg.IV.Length)
    $stream.Write($mac, 0, $mac.Length)
    $stream.Write($encrypted, 0, $encrypted.Length)
  }
  finally { $stream.Dispose() }
  [Array]::Clear($plain, 0, $plain.Length)
}

function ConvertFrom-EncryptedBackupFile {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination,
    [Parameter(Mandatory = $true)]$Cipher
  )
  $bytes = [System.IO.File]::ReadAllBytes($Source)
  if ($bytes.Length -lt 52) { throw 'Encrypted backup file is too short.' }
  $magic = [System.Text.Encoding]::ASCII.GetString($bytes, 0, 4)
  if ($magic -ne 'PRB1') { throw 'Encrypted backup file has an unexpected header.' }
  $iv = New-Object byte[] 16
  $mac = New-Object byte[] 32
  [System.Buffer]::BlockCopy($bytes, 4, $iv, 0, 16)
  [System.Buffer]::BlockCopy($bytes, 20, $mac, 0, 32)
  $encrypted = New-Object byte[] ($bytes.Length - 52)
  [System.Buffer]::BlockCopy($bytes, 52, $encrypted, 0, $encrypted.Length)
  $macInput = New-Object byte[] ($iv.Length + $encrypted.Length)
  [System.Buffer]::BlockCopy($iv, 0, $macInput, 0, $iv.Length)
  [System.Buffer]::BlockCopy($encrypted, 0, $macInput, $iv.Length, $encrypted.Length)
  $hmacAlg = New-Object System.Security.Cryptography.HMACSHA256 (, $Cipher.Hmac)
  $actualMac = $hmacAlg.ComputeHash($macInput)
  if (-not [System.Linq.Enumerable]::SequenceEqual($mac, $actualMac)) {
    throw 'Encrypted backup authentication failed.'
  }
  $aesAlg = [System.Security.Cryptography.Aes]::Create()
  $aesAlg.KeySize = 256
  $aesAlg.Mode = [System.Security.Cryptography.CipherMode]::CBC
  $aesAlg.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
  $aesAlg.Key = $Cipher.Aes
  $aesAlg.IV = $iv
  $plain = $aesAlg.CreateDecryptor().TransformFinalBlock($encrypted, 0, $encrypted.Length)
  [System.IO.File]::WriteAllBytes($Destination, $plain)
  [Array]::Clear($plain, 0, $plain.Length)
}

function Assert-LocalRestoreTarget {
  param(
    [Parameter(Mandatory = $true)][string]$HostName,
    [Parameter(Mandatory = $true)][int]$Port
  )
  $allowed = @('127.0.0.1', 'localhost')
  if ($allowed -notcontains $HostName) {
    throw "Restore rehearsal refuses host $HostName. Only 127.0.0.1 or localhost is allowed."
  }
  if ($HostName -like '*supabase.co' -or $Port -eq 5432 -or $Port -eq 6543) {
    throw 'Refusing a restore target that could be the production database.'
  }
}
