$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$device = "192.168.137.95:46137"

& $adb connect $device
& $adb -s $device reverse tcp:8081 tcp:8081
& $adb -s $device shell monkey -p com.riseriot.app -c android.intent.category.LAUNCHER 1
