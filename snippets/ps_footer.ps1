# snippets/ps_footer.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Ok ($label) {
  if ($LASTEXITCODE -ne 0) { Write-Error "$label failed. Aborting."; exit $LASTEXITCODE }
}

function Test-NonEmptyFile($p){
  if(-not(Test-Path $p)){ throw "Missing: $p" }
  if((Get-Item $p).Length -le 0){ throw "Empty: $p" }
}

function Invoke-PostChecks {
  # 1) Static file sanity (non-mutating)
  Test-NonEmptyFile ".\index.html"
  Test-NonEmptyFile ".\auth.js"
  Test-NonEmptyFile ".\wrangler.toml"

  # 2) D1: list migrations (non-mutating)
  wrangler d1 migrations list DB
  Assert-Ok "D1 migrations list"

  # 3) D1: connectivity probe (non-mutating)
  wrangler d1 execute DB --command "SELECT 1;" --remote
  Assert-Ok "D1 connectivity probe"

  # Optional simulation against a preview DB (uncomment if you approve)
  # wrangler d1 migrations apply DB --preview
  # Assert-Ok "D1 preview apply"

  Write-Host "All checks passed."
}
