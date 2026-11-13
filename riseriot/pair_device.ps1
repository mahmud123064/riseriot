$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
Write-Host "Pairing with 192.168.137.110:36381..."
& $adb pair 192.168.137.110:36381 551129
