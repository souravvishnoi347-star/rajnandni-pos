const fs = require('fs');

const psScript = `
$desktop = [Environment]::GetFolderPath('Desktop')
$out = $desktop + '\\KHOYE_HUE_BILLS.txt'
$paths = @(
  "$env:LOCALAPPDATA\\Google\\Chrome\\User Data",
  "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data"
)

$results = [System.Collections.Generic.List[string]]::new()

foreach ($p in $paths) {
  if (Test-Path $p) {
    $files = Get-ChildItem -Path $p -Recurse -Include *.ldb,*.log -ErrorAction SilentlyContinue
    foreach ($f in $files) {
      try {
        $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::GetEncoding('iso-8859-1'))
        if ($content.Contains('RJN-2026-')) {
          $idx = 0
          while ($true) {
            $found = $content.IndexOf('RJN-2026-', $idx)
            if ($found -eq -1) { break }
            $start = [Math]::Max(0, $found - 150)
            $len = [Math]::Min($content.Length - $start, 1200)
            $snippet = $content.Substring($start, $len)
            $clean = [regex]::Replace($snippet, '[^\x20-\x7E]', ' ')
            $results.Add($clean)
            $idx = $found + 10
          }
        }
      } catch {}
    }
  }
}

$results | Select-Object -Unique | Set-Content -Path $out -Encoding UTF8
Write-Host "Done! Saved to $out"
Start-Process notepad.exe $out
`;

const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
const cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + b64;

fs.writeFileSync('scripts/recovery_command.txt', cmd);
console.log('Command length:', cmd.length);
console.log('Command written to scripts/recovery_command.txt');
