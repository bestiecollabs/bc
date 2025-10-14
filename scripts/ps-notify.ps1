# Load with: . .\scripts\ps-notify.ps1
Set-StrictMode -Version Latest

function Invoke-Step {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$true)][string]$Name,
    [Parameter(Mandatory=$true)][scriptblock]$Do,
    [switch]$Quiet,
    [switch]$Details
  )
  $oldEA = $ErrorActionPreference
  $ErrorActionPreference = "Stop"
  if(-not (Get-Variable -Name LASTEXITCODE -Scope Global -ErrorAction SilentlyContinue)){
    $global:LASTEXITCODE = 0
  } else {
    $global:LASTEXITCODE = 0
  }
  try {
    if($Quiet){ & $Do | Out-Null } else { & $Do }
    $post = $global:LASTEXITCODE
    if($null -eq $post){ $post = 0 }
    if($post -ne 0){ throw "Process exit code $post" }
    Write-Host "[OK] $($Name)" -ForegroundColor DarkMagenta
    return $true
  } catch {
    $msg = $_.Exception.Message
    if($Details -and $_.InvocationInfo){
      $pos = $_.InvocationInfo.PositionMessage
      Write-Host "[ERR] $($Name): $($msg)`n$($pos)" -ForegroundColor Red
    } else {
      Write-Host "[ERR] $($Name): $($msg)" -ForegroundColor Red
    }
    return $false
  } finally {
    $ErrorActionPreference = $oldEA
  }
}