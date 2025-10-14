param(
  [string]$AdminEmail = "",
  [string]$RepoRoot = $(Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

function Write-HostOk($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Fail($m){ throw $m }

# --- preflight: repo root
if(-not (Test-Path (Join-Path $RepoRoot ".git"))){ Fail "Not in repo root: $RepoRoot" }
Write-HostOk "Repo root present"

# --- preflight: git available
try { git --version | Out-Null } catch { Fail "Git not installed or not in PATH" }
Write-HostOk "Git available"

# --- preflight: wrangler auth
$who = ""
try { $who = wrangler whoami 2>$null } catch { }
if([string]::IsNullOrWhiteSpace($who)){ Fail "Wrangler not authenticated. Run: wrangler login" }
Write-HostOk "Wrangler authenticated"

# --- preflight: project files sanity
$must = @("index.html","scripts","seed")
$missing = @()
foreach($m in $must){ if(-not (Test-Path (Join-Path $RepoRoot $m))){ $missing += $m } }
if($missing.Count){ Fail ("Missing required paths: " + ($missing -join ", ")) }
Write-HostOk "Paths OK: index.html, scripts, seed"

$Scripts = $PSScriptRoot

Push-Location $RepoRoot
try{
  & "$Scripts\seed-write-state.ps1" -AdminEmail $AdminEmail
  & "$Scripts\seed-write-ai-readme.ps1" -AdminEmail $AdminEmail
  & "$Scripts\seed-write-handoff.ps1"
  & "$Scripts\seed-write-resume.ps1"
  & "$Scripts\seed-write-tree.ps1"
  & "$Scripts\seed-append-changelog.ps1" -Summary "seed refresh via update-seed.ps1"
  Write-HostOk "Seed refresh complete"
}
finally{
  Pop-Location
}