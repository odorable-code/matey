# 냥이(cat) BOT_MOTION 에셋만 수평 반전(좌우 미러)하여 원본 경로에 덮어씁니다.
# 대상: hello, waiting, worry, tears, anger, curiosity, compliments, stretch, ginger
# 제외: cat.png (아바타·BOT.avatar_image 용)
# DB의 asset_url 은 동일하므로 UPDATE 는 필요 없습니다.
# 실행: PowerShell에서 .\scripts\flip_cat_motion_pngs.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot "..\frontend\public\images\mascots\cat" | Resolve-Path
$files = @(
  "hello.png", "waiting.png", "worry.png", "tears.png", "anger.png",
  "curiosity.png", "compliments.png", "stretch.png", "ginger.png"
)

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
