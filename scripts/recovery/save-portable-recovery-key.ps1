# Wraps the backup AES key with a passphrase so it can be decrypted without this Windows account.
# The passphrase is typed into a masked dialog and is not printed or written to Git or Google Drive.
$ErrorActionPreference = 'Stop'
if ([System.Threading.Thread]::CurrentThread.GetApartmentState() -ne 'STA') {
  & powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File $PSCommandPath
  exit $LASTEXITCODE
}
. (Join-Path $PSScriptRoot 'recovery-common.ps1')
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Portable recovery passphrase'
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$form.FormBorderStyle = 'FixedDialog'
$form.ClientSize = New-Object System.Drawing.Size(460, 220)
$note = New-Object System.Windows.Forms.Label
$note.SetBounds(12, 12, 430, 48)
$note.Text = 'Choose a passphrase you can store away from this PC. It is not saved in the backup or in Google Drive.'
$form.Controls.Add($note)
$first = New-Object System.Windows.Forms.TextBox
$first.UseSystemPasswordChar = $true
$first.SetBounds(12, 70, 430, 24)
$second = New-Object System.Windows.Forms.TextBox
$second.UseSystemPasswordChar = $true
$second.SetBounds(12, 110, 430, 24)
$form.Controls.Add($first)
$form.Controls.Add($second)
$ok = New-Object System.Windows.Forms.Button
$ok.Text = 'Save portable wrap'
$ok.SetBounds(12, 160, 180, 32)
$ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $ok
$form.Controls.Add($ok)
if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { Write-Host 'PORTABLE_KEY_CANCELLED'; exit 2 }
if ($first.Text.Length -lt 12 -or $first.Text -ne $second.Text) {
  $first.Text = ''
  $second.Text = ''
  Write-Host 'PORTABLE_KEY_REJECTED'
  exit 3
}
$path = Join-Path (Split-Path (Get-BackupKeyPath) -Parent) 'portable-recovery-wrap.bin'
if (Test-Path -LiteralPath $path) {
  $first.Text = ''
  $second.Text = ''
  throw 'Refusing to overwrite an existing portable wrap. The original backup key was not changed.'
}
if (-not (Test-Path -LiteralPath (Get-BackupKeyPath))) {
  throw 'The original Windows-protected backup key is missing. Nothing was written.'
}
$cipher = Read-BackupCipher -Path (Get-BackupKeyPath)
$salt = New-Object byte[] 16
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($salt)
$derive = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($first.Text, $salt, 200000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
$wrapKey = $derive.GetBytes(32)
$first.Text = ''
$second.Text = ''
$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Key = $wrapKey
$aes.GenerateIV()
$raw = New-Object byte[] 64
[System.Buffer]::BlockCopy($cipher.Aes, 0, $raw, 0, 32)
[System.Buffer]::BlockCopy($cipher.Hmac, 0, $raw, 32, 32)
$encrypted = $aes.CreateEncryptor().TransformFinalBlock($raw, 0, $raw.Length)
$hmac = New-Object System.Security.Cryptography.HMACSHA256 (, $wrapKey)
$mac = $hmac.ComputeHash($encrypted)
$out = New-Object byte[] (16 + 16 + 32 + $encrypted.Length)
[System.Buffer]::BlockCopy($salt, 0, $out, 0, 16)
[System.Buffer]::BlockCopy($aes.IV, 0, $out, 16, 16)
[System.Buffer]::BlockCopy($mac, 0, $out, 32, 32)
[System.Buffer]::BlockCopy($encrypted, 0, $out, 64, $encrypted.Length)
[System.IO.File]::WriteAllBytes($path, $out)
Protect-PrivateDirectory -Path $path
[Array]::Clear($raw, 0, $raw.Length)
Write-Host 'PORTABLE_KEY_SAVED'
Write-Host 'Store the passphrase in a password manager. The wrap file stays on this PC until you copy it somewhere other than the backup folder.'
