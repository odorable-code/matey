# 냥이 호기심·스트레칭 모션만 수평 반전(다시 뒤집을 때 등). DB 경로 변경 없음.
# 실행: .\scripts\flip_cat_curiosity_stretch.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot "..\frontend\public\images\mascots\cat" | Resolve-Path
$files = @("curiosity.png", "stretch.png")

foreach ($f in $files) {
  $p = Join-Path $dir $f
  if (-not (Test-Path $p)) { Write-Warning "skip missing: $p"; continue }
  $img = [System.Drawing.Image]::FromFile($p)
  try {
    $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
    $tmp = $p + ".tmp"
    $img.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $img.Dispose()
  }
  Remove-Item $p -Force
  Rename-Item $tmp $f
  Write-Host "flipped $f"
}

Write-Host "done."
