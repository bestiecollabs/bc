# Preferred: push to main for production deploys. Use -Wrangler only for hotfixes.
param(
  [switch]$Wrangler,
  [string]$ProjectName = "bc",
  [string]$Dir = "."
)

$ErrorActionPreference = "Stop"

function Fail($m){ throw $m }
function Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }

# preflight: in repo
if(-not (Test-Path ".git")){ Fail "Not in repo root" }
Ok "Repo root detected"

# preflight: wrangler auth (for -Wrangler path or quick sanity)
try { $null = wrangler whoami 2>$null } catch { Fail "Wrangler not authenticated. Run: wrangler login" }
Ok "Wrangler authenticated"

# preflight: git present
try { git --version | Out-Null } catch { Fail "Git not installed or not in PATH" }
Ok "Git present"

if(-not $Wrangler){
  # Git-based production deploy
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  if($branch -ne "main"){ Fail "Refuse non-main deploy. Current branch: $branch" }
  git fetch --quiet origin
  $localSha  = (git rev-parse HEAD).Trim()
  $remoteSha = (git rev-parse origin/main).Trim()
  if($localSha -ne $remoteSha){
    $status = git status --porcelain
    if($status){ Fail "Working tree not clean. Commit/stash first." }
    # Fast-forward if behind; or push if ahead
    $ahead = (git rev-list --left-right --count origin/main...main).Trim().Split(" ")
    $behindCount = [int]$ahead[0]; $aheadCount = [int]$ahead[1]
    if($behindCount -gt 0){ Fail "Local main is behind origin/main by $behindCount commits. Pull first." }
  }
  git push origin main
  Ok "Pushed to origin/main. Production deploy will run via Pages Git integration."
  exit 0
}

# Wrangler hotfix deploy to production (use sparingly)
wrangler pages deployment create $Dir --project-name $ProjectName --commit-dirty=true
Ok "Wrangler production deployment initiated"
