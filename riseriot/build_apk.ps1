$ErrorActionPreference = "Stop"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "C:\Program Files\Android\Android Studio\jbr\bin;" + $env:PATH

if (-not (Test-Path "S:\")) {
    subst S: E:\Mobile_app\RiseRiot_app
}

# Clear any stale compressed_assets intermediate to prevent zip entry overwrite error
if (Test-Path "S:\RiseRiot\android\app\build\intermediates\compressed_assets") {
    Remove-Item -Recurse -Force "S:\RiseRiot\android\app\build\intermediates\compressed_assets" -ErrorAction SilentlyContinue
}

Set-Location S:\RiseRiot\android
Write-Host "Starting Gradle assembleDebug..."
.\gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain
if ($LASTEXITCODE -ne 0) {
    throw "Gradle failed with exit code $LASTEXITCODE"
}
Write-Host "assembleDebug finished successfully!"
