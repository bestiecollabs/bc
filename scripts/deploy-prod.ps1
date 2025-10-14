# Preferred: push to main for production deploys. Use -Wrangler only for hotfixes.
param(
  [switch]$Wrangler,
  [string]$ProjectName = "bc",
  [string]$Dir = "."
)

if(-not $Wrangler){
  # Git-based production deploy
  git rev-parse --abbrev-ref HEAD | ForEach-Object {
    $branch = $_.Trim()
    if($branch -ne "main"){ throw "Refuse non-main deploy. Current branch: $branch" }
  }
  # Ensure no staged changes
  $status = git status --porcelain
  if($status){ throw "Working tree not clean. Commit or stash before deploy." }
  git push origin main
  "Pushed to origin/main. Production deploy will run via Pages Git integration."
  exit 0
}

# Wrangler hotfix deploy to production (use sparingly)
wrangler pages deployment create $Dir --project-name $ProjectName --commit-dirty=true