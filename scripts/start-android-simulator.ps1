$ErrorActionPreference = "Stop"

function Get-AndroidSdkPath {
  if ($env:ANDROID_HOME) { return $env:ANDROID_HOME }
  if ($env:ANDROID_SDK_ROOT) { return $env:ANDROID_SDK_ROOT }

  $defaultPath = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path -LiteralPath $defaultPath) { return $defaultPath }

  throw "Android SDKが見つかりません。Android StudioでSDKをインストールしてください。"
}

$androidSdkPath = Get-AndroidSdkPath
$adbPath = Join-Path $androidSdkPath "platform-tools\adb.exe"
$emulatorPath = Join-Path $androidSdkPath "emulator\emulator.exe"

if (!(Test-Path -LiteralPath $adbPath) -or !(Test-Path -LiteralPath $emulatorPath)) {
  throw "adbまたはAndroid Emulatorが見つかりません: $androidSdkPath"
}

& $adbPath start-server | Out-Null
$deviceState = (& $adbPath devices) -join "`n"

if ($deviceState -match "emulator-\d+\s+offline") {
  & $adbPath kill-server | Out-Null
  & $adbPath start-server | Out-Null
  Start-Sleep -Seconds 2
  $deviceState = (& $adbPath devices) -join "`n"
}

if ($deviceState -notmatch "emulator-\d+\s+device") {
  $availableAvds = @(& $emulatorPath -list-avds)
  $preferredAvd = @("Pixel_9", "Pixel_4a") | Where-Object { $availableAvds -contains $_ } | Select-Object -First 1
  if (!$preferredAvd) { $preferredAvd = $availableAvds | Select-Object -First 1 }
  if (!$preferredAvd) { throw "Android Virtual Deviceがありません。Android Studioで作成してください。" }

  Start-Process -FilePath $emulatorPath -ArgumentList @("-avd", $preferredAvd, "-no-snapshot-load", "-netdelay", "none", "-netspeed", "full")
}

Write-Host "Androidエミュレーターの起動を待っています..."
& $adbPath wait-for-device

$bootCompleted = ""
for ($attempt = 0; $attempt -lt 90; $attempt++) {
  $bootCompleted = (& $adbPath shell getprop sys.boot_completed 2>$null).Trim()
  if ($bootCompleted -eq "1") { break }
  Start-Sleep -Seconds 2
}

if ($bootCompleted -ne "1") { throw "Androidエミュレーターの起動がタイムアウトしました。" }

& $adbPath shell input keyevent 82 | Out-Null
npx expo start --android --clear
