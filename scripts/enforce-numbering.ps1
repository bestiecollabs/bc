param(
  [string[]]$Files = @("seed\\AI_README.md","seed\\HANDOFF.md","seed\\SOP_SEED.md","seed\\RULES.md","scripts\\README.md")
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$bad = @()

function Test-File($f){
  $p = Join-Path $root $f
  if(-not (Test-Path $p)){ return }
  $lines = Get-Content $p
  $hasNumbered = $false
  foreach($ln in $lines){
    if($ln -match '^\s*#\s*\d+\)'){ $hasNumbered = $true; break }
  }
  $looksLikePS = $false
  foreach($ln in $lines){
    if($ln -match '^\s*PS\s+[A-Z]:\\' -or $ln -match '^\s*Set-Location\s' -or $ln -match '^\s*git\s' -or $ln -match '^\s*\.\s+\.\\scripts\\'){
      $looksLikePS = $true; break
    }
  }
  if($looksLikePS -and -not $hasNumbered){
    return $true
  }
  return $false
}

foreach($f in $Files){
  if(Test-File $f){ $bad += $f }
}

if($bad.Count){
  Write-Error ("Numbering Rule violation: these files include PowerShell without a preceding '# 1)' block -> " + ($bad -join ', '))
  exit 1
}

Write-Host "[OK] Numbering check passed" -ForegroundColor DarkMagenta
exit 0