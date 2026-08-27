$ErrorActionPreference = "Stop"

$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$maps = @(
  @{ Name = "space"; Source = "assets/game/space-route-map.png" }
)

foreach ($map in $maps) {
  $outputDirectory = Join-Path "assets/game/map-tiles" $map.Name
  New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

  for ($row = 0; $row -lt 6; $row++) {
    for ($column = 0; $column -lt 2; $column++) {
      $x = $column * 512
      $y = $row * 256
      $outputPath = Join-Path $outputDirectory ("tile-{0}-{1}.png" -f $row, $column)
      & $ffmpeg -hide_banner -loglevel error -y -i $map.Source -vf "crop=512:256:${x}:${y},scale=1024:512:flags=lanczos" -frames:v 1 $outputPath
      if ($LASTEXITCODE -ne 0) { throw "Failed to create map tile: $outputPath" }
    }
  }
}

Write-Host "Map tiles created."
