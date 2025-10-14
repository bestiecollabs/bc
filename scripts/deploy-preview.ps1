# Deploy a PREVIEW build for Pages project "bc"
param(
  [string]$ProjectName = "bc",
  [string]$Dir = "."
)
wrangler pages deploy $Dir --project-name $ProjectName