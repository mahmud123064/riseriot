Add-Type -AssemblyName System.Drawing

$srcIconPath = "E:\Mobile_app\RiseRiot_app\RiseRiot\assets\icon.png"
$srcFgPath = "E:\Mobile_app\RiseRiot_app\RiseRiot\assets\android-icon-foreground.png"
$srcMonoPath = "E:\Mobile_app\RiseRiot_app\RiseRiot\assets\android-icon-monochrome.png"
$resDir = "E:\Mobile_app\RiseRiot_app\RiseRiot\android\app\src\main\res"

$densities = @(
    @{ Name = "mipmap-mdpi";    LauncherSize = 48;  AdaptiveSize = 108 },
    @{ Name = "mipmap-hdpi";    LauncherSize = 72;  AdaptiveSize = 162 },
    @{ Name = "mipmap-xhdpi";   LauncherSize = 96;  AdaptiveSize = 216 },
    @{ Name = "mipmap-xxhdpi";  LauncherSize = 144; AdaptiveSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LauncherSize = 192; AdaptiveSize = 432 }
)

$srcIcon = [System.Drawing.Bitmap]::FromFile($srcIconPath)
$srcFg = [System.Drawing.Bitmap]::FromFile($srcFgPath)
$srcMono = [System.Drawing.Bitmap]::FromFile($srcMonoPath)
$darkColor = [System.Drawing.Color]::FromArgb(255, 16, 17, 21)

function Scale-Bitmap($bmp, $w, $h, $bgColor) {
    $target = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    if ($bgColor -ne $null) {
        $g.Clear($bgColor)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }
    $g.DrawImage($bmp, 0, 0, $w, $h)
    $g.Dispose()
    return $target
}

function Create-Round-Bitmap($bmp, $size) {
    $target = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)
    $g.DrawImage($bmp, 0, 0, $size, $size)
    $g.ResetClip()
    $path.Dispose()
    $g.Dispose()
    return $target
}

foreach ($d in $densities) {
    $folder = Join-Path $resDir $d.Name
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
    Write-Host "Updating $($d.Name)..."

    # Remove old .webp files to avoid duplicate resource collisions
    $webpFiles = @("ic_launcher.webp", "ic_launcher_round.webp", "ic_launcher_background.webp", "ic_launcher_foreground.webp", "ic_launcher_monochrome.webp")
    foreach ($wf in $webpFiles) {
        $wp = Join-Path $folder $wf
        if (Test-Path $wp) { Remove-Item $wp -Force }
    }

    # 1. ic_launcher.png
    $launcher = Scale-Bitmap $srcIcon $d.LauncherSize $d.LauncherSize $darkColor
    $launcher.Save((Join-Path $folder "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    
    # 2. ic_launcher_round.png
    $round = Create-Round-Bitmap $launcher $d.LauncherSize
    $round.Save((Join-Path $folder "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $round.Dispose()
    $launcher.Dispose()

    # 3. ic_launcher_background.png
    $bg = New-Object System.Drawing.Bitmap($d.AdaptiveSize, $d.AdaptiveSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bgG = [System.Drawing.Graphics]::FromImage($bg)
    $bgG.Clear($darkColor)
    $bgG.Dispose()
    $bg.Save((Join-Path $folder "ic_launcher_background.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bg.Dispose()

    # 4. ic_launcher_foreground.png
    $fg = Scale-Bitmap $srcFg $d.AdaptiveSize $d.AdaptiveSize $null
    $fg.Save((Join-Path $folder "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fg.Dispose()

    # 5. ic_launcher_monochrome.png
    $mono = Scale-Bitmap $srcMono $d.AdaptiveSize $d.AdaptiveSize $null
    $mono.Save((Join-Path $folder "ic_launcher_monochrome.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $mono.Dispose()
}

$srcIcon.Dispose()
$srcFg.Dispose()
$srcMono.Dispose()

Write-Host "All Android native mipmap icons successfully updated!"
