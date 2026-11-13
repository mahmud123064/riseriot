$adb = "C:\Users\MAHMUD\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$device = "192.168.137.110:42279"
$apk = "E:\Mobile_app\RiseRiot_app\RiseRiot\android\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "Connecting to device $device..."
& $adb connect $device

Write-Host "Disconnecting offline artifacts..."
& $adb disconnect 192.168.137.110:42277 2>$null

Write-Host "Configuring reverse proxy for Metro on port 8081..."
& $adb -s $device reverse tcp:8081 tcp:8081

Write-Host "Installing APK $apk..."
& $adb -s $device install -r -d $apk

Write-Host "Launching app com.riseriot.app..."
& $adb -s $device shell am start -n com.riseriot.app/.MainActivity

Write-Host "App launch initiated!"
