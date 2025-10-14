$Root=(Resolve-Path ".").Path; $SeedDir=Join-Path $Root "seed"
if(-not(Test-Path $SeedDir)){ New-Item -Type Directory -Force -Path $SeedDir | Out-Null }
function NowIso(){ (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
$statePath = Join-Path $SeedDir "state.json"
$state = if(Test-Path $statePath){ Get-Content $statePath -Raw | ConvertFrom-Json } else { $null }

$lines = @()
$lines += "#! handoff"
$lines += ""
$lines += "Generated: $(NowIso)"
if($state){
  $lines += "Project: $($state.project.name)"
  $lines += "Domains: $([string]::Join(', ', $state.project.domains))"
  $lines += "Preview: $($state.project.preview_pattern)"
  $lines += "Git: $($state.git.branch) @ $($state.git.sha)"
  $lines += "D1: $($state.db.d1_name) binding $($state.db.binding)"
}
$lines += ""
$lines += "## Next two tasks"
$lines += "1) Admin dashboard shell with session guard + KPIs."
$lines += "2) Brands CSV import report UI wired to /api/admin/brands/import (dry-run + commit)."
$path = Join-Path $SeedDir "HANDOFF.md"
[IO.File]::WriteAllText($path, ($lines -join [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
"HANDOFF.md written -> $path"


