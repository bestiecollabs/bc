param(
  [Parameter(Mandatory=$true)][string]$Task1,
  [Parameter(Mandatory=$true)][string]$Task2
)
$ErrorActionPreference = "Stop"

function Write-Utf8NoBom($Path,$Text){
  [IO.File]::WriteAllText($Path,$Text,[Text.UTF8Encoding]::new($false))
}
function NowPst(){
  $tz = [System.TimeZoneInfo]::FindSystemTimeZoneById("Pacific Standard Time")
  [System.TimeZoneInfo]::ConvertTime([datetime]::UtcNow, $tz).ToString("yyyy-MM-dd HH:mm 'PST'")
}

$root = Split-Path -Parent $PSScriptRoot
$seed = Join-Path $root "seed"

# --- Update HANDOFF.md NEXT TASKS block and timestamp line
$handoff = Join-Path $seed "HANDOFF.md"
if(Test-Path $handoff){
  $txt = Get-Content $handoff -Raw
  # refresh timestamp in title
  $txt = [regex]::Replace($txt,'^(#\s*HANDOFF\.md[^\(]*\()[^)]+\)',('$1'+(NowPst())+')'),'Multiline'
  # replace "Next 2 tasks" block
  $txt = [regex]::Replace($txt,'(?s)##\s*Next\s*2\s*tasks.*?\Z',"## Next 2 tasks (do now)`r`n1) $Task1`r`n2) $Task2`r`n")
  Write-Utf8NoBom $handoff $txt
}

# --- Update AI_README.md NEXT TASKS block (keep rest intact)
$aireadme = Join-Path $seed "AI_README.md"
if(Test-Path $aireadme){
  $txt = Get-Content $aireadme -Raw
  $txt = [regex]::Replace($txt,'(?s)NEXT TASKS.*?---',"NEXT TASKS`r`n1) $Task1`r`n2) $Task2`r`n`r`n---")
  Write-Utf8NoBom $aireadme $txt
}

# --- Update RESUME.md TODOs
$resume = Join-Path $seed "RESUME.md"
if(Test-Path $resume){
  $txt = Get-Content $resume -Raw
  $txt = [regex]::Replace($txt,'(?s)##\s*TODOs.*?##',"## TODOs`r`n- $Task1`r`n- $Task2`r`n`r`n##",'IgnoreCase')
  Write-Utf8NoBom $resume $txt
}

# --- Append CHANGELOG_AI.md entry
$changelog = Join-Path $seed "CHANGELOG_AI.md"
$entry = "## $(NowPst) - update next tasks`r`n- Task1: $Task1`r`n- Task2: $Task2`r`n"
Add-Content -Path $changelog -Value $entry -Encoding UTF8

Write-Host "[OK] Goals updated" -ForegroundColor DarkMagenta