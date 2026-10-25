# Saves the production database connection with Windows DPAPI for the current user.
# The password is typed into a masked dialog. It is not printed, not written to Git,
# and not placed on the PowerShell command line.
# See docs/general/payment-feature-recovery-runbook.md.

$ErrorActionPreference = 'Stop'
if ([System.Threading.Thread]::CurrentThread.GetApartmentState() -ne 'STA') {
  & powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File $PSCommandPath
  exit $LASTEXITCODE
}
. (Join-Path $PSScriptRoot 'recovery-common.ps1')

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Pilates production backup'
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ClientSize = New-Object System.Drawing.Size(520, 340)

$intro = New-Object System.Windows.Forms.Label
$intro.SetBounds(16, 12, 488, 48)
$intro.Text = 'Enter the Session pooler details from the Supabase dashboard. Use port 5432. Do not use the transaction pooler (port 6543). Nothing you type is sent to chat.'
$form.Controls.Add($intro)

function Add-Field {
  param($Label, $Top, $Default, [switch]$Secret)
  $caption = New-Object System.Windows.Forms.Label
  $caption.SetBounds(16, $Top, 120, 24)
  $caption.Text = $Label
  $box = New-Object System.Windows.Forms.TextBox
  $box.SetBounds(140, $Top, 360, 24)
  $box.Text = $Default
  if ($Secret) { $box.UseSystemPasswordChar = $true }
  $form.Controls.Add($caption)
  $form.Controls.Add($box)
  return $box
}

$hostBox = Add-Field -Label 'Host' -Top 70 -Default 'aws-0-eu-west-1.pooler.supabase.com'
$portBox = Add-Field -Label 'Port' -Top 104 -Default '5432'
$userBox = Add-Field -Label 'User' -Top 138 -Default 'postgres.xzlirjwzpmvugkbhtzxw'
$databaseBox = Add-Field -Label 'Database' -Top 172 -Default 'postgres'
$passwordBox = Add-Field -Label 'Password' -Top 206 -Default '' -Secret

$ok = New-Object System.Windows.Forms.Button
$ok.Text = 'Save encrypted credential'
$ok.SetBounds(140, 260, 200, 32)
$ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $ok
$form.Controls.Add($ok)

$cancel = New-Object System.Windows.Forms.Button
$cancel.Text = 'Cancel'
$cancel.SetBounds(350, 260, 150, 32)
$cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.CancelButton = $cancel
$form.Controls.Add($cancel)

$result = $form.ShowDialog()
if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
  Write-Host 'CREDENTIALS_CANCELLED'
  exit 2
}

$portValue = 0
if (-not [int]::TryParse($portBox.Text.Trim(), [ref]$portValue)) {
  throw 'Port must be a number.'
}
$connection = [pscustomobject]@{
  Host = $hostBox.Text.Trim()
  Port = $portValue
  User = $userBox.Text.Trim()
  Password = $passwordBox.Text
  Database = $databaseBox.Text.Trim()
}

$passwordBox.Text = ''
if ($connection.Password -match '(?i)\[PASSWORD|YOUR-PASSWORD|postgresql://|postgres://') {
  [System.Windows.Forms.MessageBox]::Show(
    'The password box still contains a placeholder or a whole connection string. Type only the database password from the Supabase dashboard. Do not include [PASSWORD] or the postgresql:// URI.',
    'Password not saved'
  ) | Out-Null
  throw 'Credential was not saved because the password was a placeholder.'
}
try {
  Assert-ProductionConnection -Connection $connection -ExpectedProjectRef 'xzlirjwzpmvugkbhtzxw'
  $payload = @{
    host = $connection.Host
    port = $connection.Port
    user = $connection.User
    database = $connection.Database
    password = $connection.Password
  } | ConvertTo-Json -Compress
  $path = Get-ProductionCredentialPath
  $directory = Split-Path $path -Parent
  if (-not (Test-Path $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
  Protect-PrivateDirectory -Path $directory
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  [System.IO.File]::WriteAllBytes($path, (Protect-BytesForCurrentUser -Bytes $bytes))
  Protect-PrivateDirectory -Path $path
  [Array]::Clear($bytes, 0, $bytes.Length)
  Write-Host 'CREDENTIALS_SAVED'
  Write-Host "HOST=$($connection.Host)"
  Write-Host "PORT=$($connection.Port)"
  Write-Host "USER=$($connection.User)"
  Write-Host "DATABASE=$($connection.Database)"
}
finally {
  $connection.Password = $null
  $payload = $null
}
