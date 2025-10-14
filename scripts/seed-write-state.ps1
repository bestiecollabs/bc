param(
  [string]$ProjectName = "bc",
  [string[]]$Domains = @("bestiecollabs.com","api.bestiecollabs.com"),
  [string]$PreviewPattern = "*.bc-ezy.pages.dev",
  [string]$D1Name = "bestiedb",
  [string]$D1Binding = "DB",
  [string]$AdminEmail = ""
)

$Root=(Resolve-Path ".").Path
$SeedDir=Join-Path $Root "seed"
if(-not(Test-Path $SeedDir)){ New-Item -Type Directory -Force -Path $SeedDir | Out-Null }

function NowIso(){ (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
function MaskEmail([string]$e){
  if([string]::IsNullOrWhiteSpace($e)){ return "" }
  $p=$e.Split("@",2); if($p.Length -ne 2){ return $e }
  $left=$p[0]; $right=$p[1]
  $mask = if($left.Length -le 2){ $left } else { $left.Substring(0,2) }
  return "$mask***@$right"
}
function ExecGit([string]$args){
  try{ (git $args) 2>$null }catch{ "" }
}

$gitBranch = (ExecGit "rev-parse --abbrev-ref HEAD").Trim()
$gitSha    = (ExecGit "rev-parse --short HEAD").Trim()
$gitRemote = (ExecGit "config --get remote.origin.url").Trim()

$allowStr = $env:ADMIN_ALLOWLIST
$allowHas = -not [string]::IsNullOrWhiteSpace($allowStr)
$allowLen = if($allowHas){ ($allowStr -split ",").Where({$_ -ne ""}).Count } else { 0 }

$state = [ordered]@{
  generated_at = (NowIso)
  project = [ordered]@{
    name = $ProjectName
    domains = $Domains
    preview_pattern = $PreviewPattern
    preview_url = ""
  }
  git = [ordered]@{
    branch = $gitBranch
    sha    = $gitSha
    remote = $gitRemote
  }
  admin = [ordered]@{
    allowlist_has_value = $allowHas
    allowlist_length    = $allowLen
    whoami_email_masked = (MaskEmail $AdminEmail)
    whoami_allowed      = $false
  }
  db = [ordered]@{
    d1_name  = $D1Name
    binding  = $D1Binding
  }
}

$statePath = Join-Path $SeedDir "state.json"
[IO.File]::WriteAllText($statePath, ($state | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
"state.json written -> $statePath"