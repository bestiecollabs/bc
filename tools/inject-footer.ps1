# tools/inject-footer.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot   = (git rev-parse --show-toplevel).Trim()
$footerPath = Join-Path $repoRoot "snippets\ps_footer.ps1"

if (-not (Test-Path $footerPath)) {
  throw "Footer module not found: $footerPath"
}

# Find all .ps1 files except the footer and this injector
$ps1s = Get-ChildItem -Path $repoRoot -Filter *.ps1 -Recurse |
  Where-Object {
    $_.FullName -ne $footerPath -and
    $_.Name -ne 'inject-footer.ps1'
  }

$include = '. "$(git rev-parse --show-toplevel)\snippets\ps_footer.ps1"'

foreach ($f in $ps1s) {
  $content = Get-Content -Raw -LiteralPath $f.FullName

  # Ensure dot-source include near top (idempotent)
  if ($content -notmatch [regex]::Escape($include)) {
    $lines = $content -split "`r?`n"
    if ($lines.Count -gt 0) {
      $lines = @($lines[0]) + @($include) + $lines[1..($lines.Count-1)]
    } else {
      $lines = @($include)
    }
    $content = ($lines -join "`r`n")
  }

  # Ensure Invoke-PostChecks appears before first git add/commit/push
  if ($content -match '(?im)^\s*git\s+(add|commit|push)\b' -and $content -notmatch '(?im)^\s*Invoke-PostChecks\b') {
    $content = $content -replace '(?im)^(?=\s*git\s+(add|commit|push)\b)', "Invoke-PostChecks`r`n"
  }

  Set-Content -LiteralPath $f.FullName -Value $content -Encoding UTF8
  Write-Host "Updated: $($f.FullName)"
}

Write-Host "Injection complete."
