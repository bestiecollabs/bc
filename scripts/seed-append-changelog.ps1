param([string]$Summary = "Seed refresh")

$Root=(Resolve-Path ".").Path
$SeedDir=Join-Path $Root "seed"
if(-not(Test-Path $SeedDir)){ New-Item -Type Directory -Force -Path $SeedDir | Out-Null }

function NowIso(){ (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
function ExecGit([string]$args){ try{ (git $args) 2>$null }catch{ "" } }

$branch = (ExecGit "rev-parse --abbrev-ref HEAD").Trim()
$sha    = (ExecGit "rev-parse --short HEAD").Trim()

$lines = @()
$lines += "## $(NowIso) - $branch @ $sha"
$lines += "- $Summary"
$lines += ""

$path = Join-Path $SeedDir "CHANGELOG_AI.md"
Add-Content -Path $path -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
"CHANGELOG_AI.md appended -> $path"