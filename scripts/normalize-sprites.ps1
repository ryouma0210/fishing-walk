param(
  [switch]$Apply
)

Add-Type -AssemblyName System.Drawing

function Find-VerticalValley {
  param($Bitmap, [int]$Nominal, [int]$Radius, [int]$Top, [int]$Bottom)
  $from = [Math]::Max(1, $Nominal - $Radius)
  $to = [Math]::Min($Bitmap.Width - 2, $Nominal + $Radius)
  $best = $Nominal
  $bestScore = [int]::MaxValue
  for ($x = $from; $x -le $to; $x++) {
    $score = 0
    for ($y = $Top; $y -lt $Bottom; $y += 2) {
      if ($Bitmap.GetPixel($x, $y).A -ge 36) { $score++ }
    }
    if ($score -lt $bestScore -or ($score -eq $bestScore -and [Math]::Abs($x - $Nominal) -lt [Math]::Abs($best - $Nominal))) {
      $bestScore = $score
      $best = $x
    }
  }
  return $best
}

function Find-HorizontalValley {
  param($Bitmap, [int]$Nominal, [int]$Radius)
  $from = [Math]::Max(1, $Nominal - $Radius)
  $to = [Math]::Min($Bitmap.Height - 2, $Nominal + $Radius)
  $best = $Nominal
  $bestScore = [int]::MaxValue
  for ($y = $from; $y -le $to; $y++) {
    $score = 0
    for ($x = 0; $x -lt $Bitmap.Width; $x += 2) {
      if ($Bitmap.GetPixel($x, $y).A -ge 36) { $score++ }
    }
    if ($score -lt $bestScore -or ($score -eq $bestScore -and [Math]::Abs($y - $Nominal) -lt [Math]::Abs($best - $Nominal))) {
      $bestScore = $score
      $best = $y
    }
  }
  return $best
}

function Normalize-TransparentGrid {
  param([string]$Path, [int]$Columns, [int]$Rows, [double]$Fill = 0.82)
  $resolved = (Resolve-Path -LiteralPath $Path).Path
  $source = [System.Drawing.Bitmap]::FromFile($resolved)
  try {
    $cellWidth = $source.Width / $Columns
    $cellHeight = $source.Height / $Rows
    $rowBounds = [System.Collections.Generic.List[int]]::new()
    $rowBounds.Add(0)
    for ($row = 1; $row -lt $Rows; $row++) {
      $rowBounds.Add((Find-HorizontalValley $source ([int]($row * $cellHeight)) ([int]($cellHeight * 0.22))))
    }
    $rowBounds.Add($source.Height)

    $columnBounds = @()
    for ($row = 0; $row -lt $Rows; $row++) {
      $bounds = [System.Collections.Generic.List[int]]::new()
      $bounds.Add(0)
      for ($column = 1; $column -lt $Columns; $column++) {
        $bounds.Add((Find-VerticalValley $source ([int]($column * $cellWidth)) ([int]($cellWidth * 0.22)) $rowBounds[$row] $rowBounds[$row + 1]))
      }
      $bounds.Add($source.Width)
      $columnBounds += ,$bounds
    }

    $output = [System.Drawing.Bitmap]::new($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($output)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        for ($row = 0; $row -lt $Rows; $row++) {
          for ($column = 0; $column -lt $Columns; $column++) {
            $sourceX = $columnBounds[$row][$column]
            $sourceY = $rowBounds[$row]
            $sourceWidth = $columnBounds[$row][$column + 1] - $sourceX
            $sourceHeight = $rowBounds[$row + 1] - $sourceY
            $targetX = [int]($column * $cellWidth)
            $targetY = [int]($row * $cellHeight)
            $targetCellWidth = if ($column -eq $Columns - 1) { $source.Width - $targetX } else { [int](($column + 1) * $cellWidth) - $targetX }
            $targetCellHeight = if ($row -eq $Rows - 1) { $source.Height - $targetY } else { [int](($row + 1) * $cellHeight) - $targetY }
            $scale = [Math]::Min(($targetCellWidth * $Fill) / $sourceWidth, ($targetCellHeight * $Fill) / $sourceHeight)
            $drawWidth = [Math]::Max(1, [int]($sourceWidth * $scale))
            $drawHeight = [Math]::Max(1, [int]($sourceHeight * $scale))
            $drawX = $targetX + [int](($targetCellWidth - $drawWidth) / 2)
            $drawY = $targetY + [int](($targetCellHeight - $drawHeight) / 2)
            $graphics.DrawImage(
              $source,
              [System.Drawing.Rectangle]::new($drawX, $drawY, $drawWidth, $drawHeight),
              [System.Drawing.Rectangle]::new($sourceX, $sourceY, $sourceWidth, $sourceHeight),
              [System.Drawing.GraphicsUnit]::Pixel
            )
          }
        }
      } finally { $graphics.Dispose() }
      if ($Apply) {
        $temporary = "$resolved.normalized.png"
        $output.Save($temporary, [System.Drawing.Imaging.ImageFormat]::Png)
        $source.Dispose()
        Move-Item -LiteralPath $temporary -Destination $resolved -Force
      }
    } finally { $output.Dispose() }
  } finally { if ($source) { $source.Dispose() } }
}

$root = Split-Path -Parent $PSScriptRoot
$game = Join-Path $root "assets\game"

Get-ChildItem -LiteralPath (Join-Path $game "prefectures") -Filter "*.png" | ForEach-Object { Normalize-TransparentGrid $_.FullName 5 2 }
Get-ChildItem -LiteralPath (Join-Path $game "world") -Filter "*.png" | ForEach-Object { Normalize-TransparentGrid $_.FullName 5 2 }
Get-ChildItem -LiteralPath (Join-Path $game "space") -Filter "*.png" | ForEach-Object { Normalize-TransparentGrid $_.FullName 5 2 }

@("pond", "river", "lake", "sea") | ForEach-Object {
  Normalize-TransparentGrid (Join-Path $game "fish-$($_)-transparent.png") 4 5
}
Normalize-TransparentGrid (Join-Path $game "fish-pond-extra-transparent.png") 5 6
Normalize-TransparentGrid (Join-Path $game "fish-river-extra-transparent.png") 5 6
Normalize-TransparentGrid (Join-Path $game "fish-lake-extra-transparent.png") 5 4
Normalize-TransparentGrid (Join-Path $game "fish-sea-extra-transparent.png") 5 4

