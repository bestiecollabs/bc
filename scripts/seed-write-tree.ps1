$Root=(Resolve-Path ".").Path; $SeedDir=Join-Path $Root "seed"
if(-not(Test-Path $SeedDir)){ New-Item -Type Directory -Force -Path $SeedDir | Out-Null }
function Write-Utf8($p,$s){ [IO.File]::WriteAllText($p,$s,[Text.UTF8Encoding]::new($false)) }

$lines = Get-ChildItem -Recurse -File | Where-Object {
  $_.FullName -notmatch "\\node_modules\\" -and
  $_.FullName -notmatch "\\\.git\\" -and
  $_.FullName -notmatch "\\dist\\" -and
  $_.FullName -notmatch "\\\.wrangler\\"
} | ForEach-Object {
  $rel = $_.FullName.Replace($Root,[string]::Empty).TrimStart('\')
  "$rel`t$([int64]$_.Length)"
} | Out-String

$path = Join-Path $SeedDir "ai_tree.txt"
Write-Utf8 $path $lines
"ai_tree.txt written -> $path"