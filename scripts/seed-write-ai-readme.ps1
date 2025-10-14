param([string]$AdminEmail = "")
$Root=(Resolve-Path ".").Path; $SeedDir=Join-Path $Root "seed"
if(-not(Test-Path $SeedDir)){ New-Item -Type Directory -Force -Path $SeedDir | Out-Null }
function NowIso(){ (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss") + " UTC" }
function MaskEmail([string]$e){
  if([string]::IsNullOrWhiteSpace($e)){ return "" }
  $p=$e.Split("@",2); if($p.Length -ne 2){ return $e }
  $left=$p[0]; $right=$p[1]
  $mask = if($left.Length -le 2){ $left } else { $left.Substring(0,2) }
  return "$mask***@$right"
}
$statePath = Join-Path $SeedDir "state.json"
$state = if(Test-Path $statePath){ Get-Content $statePath -Raw | ConvertFrom-Json } else { $null }

$proj = if($state){ $state.project.name } else { "bc" }
$domains = if($state){ ($state.project.domains -join ", ") } else { "bestiecollabs.com, api.bestiecollabs.com" }
$preview = if($state){ $state.project.preview_pattern } else { "*.bc-ezy.pages.dev" }
$branch = if($state){ $state.git.branch } else { "" }
$sha = if($state){ $state.git.sha } else { "" }
$d1 = if($state){ $state.db.d1_name } else { "bestiedb" }

$txt = @"
# AI_README

- Generated: $(NowIso)
- Project: $proj
- Domains: $domains
- Preview: $preview
- Git: $branch @ $sha
- D1: $d1

## Rules snapshot
- Production-first. Build and test against live.
- Cloudflare Pages project "bc". Custom domains bestiecollabs.com and api.bestiecollabs.com.
- D1 database "bestiedb" binding "DB".
- Static HTML + vanilla JS. Shared air.css and auth.js. Logo file: b1.png in project root.
- No secrets in code. Deploy via Git to main. Wrangler only for local hotfixes.
- No renames or restructures without approval. Provide full file paths and complete code with a short "What to expect".
- Numbered PowerShell steps. Halt on errors and fix before proceeding.

## Current focus
1) Admin dashboard shell with session guard + KPIs.
2) Brands CSV import report UI wired to /api/admin/brands/import (dry-run + commit).

"@
$path = Join-Path $SeedDir "AI_README.md"
[IO.File]::WriteAllText($path,$txt,[Text.UTF8Encoding]::new($false))
"AI_README.md written -> $path"