param(
  [Parameter(Mandatory=$true)][string]$Task1,
  [Parameter(Mandatory=$true)][string]$Task2,
  [string]$RepoRoot = "C:\bc\cloudflare\html",
  [string]$AdminEmail = ""
)
$ErrorActionPreference = "Stop"

function NowPst(){
  $tz = [System.TimeZoneInfo]::FindSystemTimeZoneById("Pacific Standard Time")
  return [System.TimeZoneInfo]::ConvertTime([datetime]::UtcNow, $tz).ToString("yyyy-MM-dd HH:mm 'PST'")
}
function WUtf8($p,$s){ [IO.File]::WriteAllText($p,$s,[Text.UTF8Encoding]::new($false)) }

# seed dir
$Seed = Join-Path $RepoRoot "seed"
if(-not (Test-Path $Seed)){ New-Item -Type Directory -Force -Path $Seed | Out-Null }

# state
$statePath = Join-Path $Seed "state.json"
$state = if(Test-Path $statePath){ Get-Content $statePath -Raw | ConvertFrom-Json } else { $null }

# derive
$proj    = if($state){ $state.project.name } else { "bc" }
$domains = if($state){ ($state.project.domains -join ", ") } else { "bestiecollabs.com, api.bestiecollabs.com" }
$preview = if($state){ $state.project.preview_pattern } else { "*.bc-ezy.pages.dev" }
$d1name  = if($state){ $state.db.d1_name } else { "bestiedb" }
$d1bind  = if($state){ $state.db.binding } else { "DB" }

# git info (robust, ASCII)
$branch = (git rev-parse --abbrev-ref HEAD) 2>$null
if($branch -is [array]){ $branch = ($branch -join "") }
$branch = "$branch".Trim()
if([string]::IsNullOrWhiteSpace($branch)){ $branch = "unknown" }

$sha = (git rev-parse --short HEAD) 2>$null
if($sha -is [array]){ $sha = ($sha -join "") }
$sha = "$sha".Trim()
if([string]::IsNullOrWhiteSpace($sha)){ $sha = "no-sha" }

$when  = NowPst
$stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# ai_readme
$ai = @(
  "#! ai_readme.md - Active Snapshot ($when)",
  "",
  "PROJECT",
  "- Bestie Collabs",
  "",
  "STACK",
  "- Static HTML + vanilla JS on Cloudflare Pages",
  "- Pages Functions in /functions",
  "- D1 database $d1name (binding $d1bind)",
  "- Repo: https://github.com/bestiecollabs/$proj  branch $branch  sha $sha",
  "- Local root: C:\bc\cloudflare\html",
  "",
  "PROD URLS",
  "- App: https://bestiecollabs.com",
  "- API: https://api.bestiecollabs.com",
  "- Health: /api/healthcheck -> { ok: true }",
  "",
  "SEED RULES (excerpt)",
  "- Step-by-step. Full file contents. Exact paths. PowerShell-first.",
  "- No patches. Fix root causes. Keep structure and names.",
  "- Production-first. Deploy by pushing main.",
  "- New Chat Rule: Every new chat must read the current GitHub codebase and confirm the rules before writing any code.",
  "",
  "NEXT TASKS",
  "1) $Task1",
  "2) $Task2",
  "",
  "---"
) -join "`r`n"

# handoff
$handoff = @(
  "#! handoff.md - v3.2 ($when)",
  "",
  "We left off: Cloudflare deploy is green, Functions compile.",
  "",
  "## Environment",
  "- Pages project: $proj",
  "- Domains: $domains",
  "- Preview pattern: $preview",
  "- D1: $d1name (binding $d1bind)",
  "- Repo: branch $branch @ $sha",
  "",
  "## Deploy flow",
  "1) Edit locally in C:\bc\cloudflare\html",
  "2) git add -A && git commit -m ""msg"" && git push origin main",
  "3) Cloudflare auto-deploys (Functions from /functions)",
  "",
  "## Verify",
  "- GET /api/healthcheck -> { ok: true }",
  "- Custom domains Active, SSL Full",
  "- No wrangler parse/BOM errors",
  "",
  "## Guardrails",
  "- PowerShell-first. Full files. Exact paths. Keep structure and names.",
  "- Production-first on main. Explain what it does and what to expect.",
  "- New Chat Rule: Every new chat must read the current GitHub codebase before any work.",
  "",
  "## Rollback & Tags",
  "- Tag stable: git tag v0.1-setup-clean && git push origin --tags",
  "- Rollback: git revert <sha>  or deploy previous commit in Cloudflare",
  "",
  "## Resuming a session",
  "1) Load seed/state.json and seed/resume.md",
  "2) Confirm handoff timestamp and tasks",
  "3) Run scripts/update-seed.ps1",
  "4) Start with ""Next 2 tasks""",
  "",
  "## Next 2 tasks (do now)",
  "1) $Task1",
  "2) $Task2"
) -join "`r`n"

# resume
$resume = @(
  "#! resume - $when",
  "",
  "## TODOs",
  "- $Task1",
  "- $Task2",
  "",
  "## Context",
  "Project: $proj",
  "Domains: $domains",
  "Preview: $preview",
  "Git: $branch @ $sha",
  "D1: $d1name binding $d1bind"
) -join "`r`n"

# write files
WUtf8 (Join-Path $Seed "AI_README.md") $ai
WUtf8 (Join-Path $Seed "HANDOFF.md")   $handoff
WUtf8 (Join-Path $Seed "RESUME.md")    $resume

# changelog
$cl = @()
$cl += "## $stamp - $branch @ $sha"
$cl += "- set-handoff-goals: '$Task1' and '$Task2'"
$cl += ""
Add-Content -Path (Join-Path $Seed "CHANGELOG_AI.md") -Value ($cl -join [Environment]::NewLine) -Encoding UTF8

Write-Host "Updated: AI_README.md, HANDOFF.md, RESUME.md, CHANGELOG_AI.md"
exit 0