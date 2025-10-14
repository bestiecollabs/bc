$Root=(Resolve-Path ".").Path; $SeedDir=Join-Path $Root "seed"
if(-not(Test-Path $SeedDir)){ New-Item -Type Directory -Force -Path $SeedDir | Out-Null }
function NowIso(){ (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
$statePath = Join-Path $SeedDir "state.json"
$state = if(Test-Path $statePath){ Get-Content $statePath -Raw | ConvertFrom-Json } else { $null }

$txt = @"
#! resume

Generated: $(NowIso)

## TODOs
- Build /admin/dashboard/ shell with session guard + KPIs.
- Wire Brands CSV import report UI to /api/admin/brands/import (dry-run + commit).

## Context
Project: $($state.project.name)
Domains: $([string]::Join(', ', $state.project.domains))
Preview: $($state.project.preview_pattern)
Git: $($state.git.branch) @ $($state.git.sha)
D1: $($state.db.d1_name) binding $($state.db.binding)
"@
$path = Join-Path $SeedDir "RESUME.md"
[IO.File]::WriteAllText($path,$txt,[Text.UTF8Encoding]::new($false))
"RESUME.md written -> $path"


