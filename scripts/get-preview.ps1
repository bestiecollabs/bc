# Return latest preview URL for project "bc"
param(
  [string]$ProjectName = "bc"
)

# Ask Wrangler for deployments as JSON
$json = wrangler pages deployment list --project-name $ProjectName --format json | Out-String
if([string]::IsNullOrWhiteSpace($json)){ throw "No data from Wrangler." }

$data = $json | ConvertFrom-Json
if(-not $data){ throw "Invalid JSON from Wrangler." }

# Prefer 'is_latest' if present, else newest by created_on
$latest = $data | Where-Object { $_.is_latest } | Select-Object -First 1
if(-not $latest){
  $latest = $data | Sort-Object { Get-Date $_.created_on } -Descending | Select-Object -First 1
}
if(-not $latest){ throw "No deployments found for $ProjectName." }

# Expect a preview URL in 'url' or 'urls'
$url = $latest.url
if(-not $url -and $latest.urls){ $url = $latest.urls | Select-Object -First 1 }

if(-not $url){ throw "No preview URL on latest deployment." }
$url