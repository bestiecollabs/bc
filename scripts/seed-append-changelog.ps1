param([string]$Summary = "Seed refresh")
$ErrorActionPreference = "Stop"

function NowIso(){ (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
function ExecGit { param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Args) try { git @Args } catch { "" } }

try{
  $Root    = (Resolve-Path ".").Path
  $SeedDir = Join-Path $Root "seed"
  if(-not (Test-Path $SeedDir)){ New-Item -Type Directory -Force -Path $SeedDir | Out-Null }

  $branch = (ExecGit rev-parse --abbrev-ref HEAD) -join "" ; $branch = $branch.Trim(); if(!$branch){ $branch="unknown" }
  $sha    = (ExecGit rev-parse --short HEAD)      -join "" ; $sha    = $sha.Trim();    if(!$sha){ $sha="no-sha" }

  $safeSummary = ($Summary -replace '\r|\n',' ').Trim()

  $lines = @()
  $lines += "## $(NowIso) - $branch @ $sha"
  $lines += "- $safeSummary"
  $lines += ""

  $path = Join-Path $SeedDir "CHANGELOG_AI.md"
  Add-Content -Path $path -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
  Write-Host "CHANGELOG_AI.md appended -> $path"
  exit 0
}
catch{
  Write-Error $_.Exception.Message
  exit 1
}