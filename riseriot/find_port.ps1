$ip = "192.168.137.110"
$ports = 32000..46000

# Fast multi-threaded or batch socket check
Write-Host "Scanning common ADB wireless ports on $ip..."
$found = @()

# First check common ranges
35000..45000 | ForEach-Object -Parallel {
    $port = $_
    $ip = $using:ip
    $socket = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $socket.BeginConnect($ip, $port, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(40, $false)) {
            $socket.EndConnect($async)
            Write-Host "OPEN PORT FOUND: $port"
        }
    } catch {
    } finally {
        $socket.Close()
    }
} -ThrottleLimit 100
