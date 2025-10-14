# Return latest preview URL for Pages project from seed\state.json
param(
  [string]$RepoRoot = "C:\bc\cloudflare\html"
)

$ErrorActionPreference = "Stop"

# Load preview pattern and project name from seed\state.json
$seed = Join-Path $RepoRoot "seed"
$statePath = Join-Path $seed "state.json"
if(-not (Test-Path $statePath)){ throw "Missing seed\state.json. Run scripts\update-seed.ps1 first." }
$state = Get-Content $statePath -Raw | ConvertFrom-Json
$project = if($state.project.name){ $state.project.name } else { "bc" }
$pattern = if($state.project.preview_pattern){ $state.project.preview_pattern } else { "*.bc-ezy.pages.dev" }

# Convert a wildcard host pattern (e.g., *.bc-ezy.pages.dev) into a URL regex
function Convert-HostPatternToRegex([string]$pat){
  # escape dots
  $rx = [regex]::Escape($pat)
  # replace escaped asterisk with a single-label matcher
  $rx = $rx -replace "\\\*", "[^\.\/\s]+"
  return "^https://$rx$"
}

$regex = Convert-HostPatternToRegex $pattern
$rx = [regex]$regex

# Call Wrangler and parse text output for the first matching URL
$text = wrangler pages deployment list --project-name $project | Out-String
if([string]::IsNullOrWhiteSpace($text)){ throw "No output from Wrangler." }

# Extract the first URL that matches the derived regex
$urls = [regex]::Matches($text, "https://[^\s]+") | ForEach-Object { $_.Value }
$match = $urls | Where-Object { $_ -match $rx } | Select-Object -First 1
if(-not $match){ throw "No preview URL found matching $pattern for project '$project'." }
$match