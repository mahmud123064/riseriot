$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$device = "192.168.137.95:46137"
$apk = "S:\RiseRiot\android\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "Connecting to $device..."
& $adb connect $device

Write-Host "Setting up reverse port forwarding..."
& $adb -s $device reverse tcp:8081 tcp:8081

Write-Host "Installing APK..."
& $adb -s $device install -r $apk

Write-Host "Installation completed!"
