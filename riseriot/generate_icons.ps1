Add-Type -AssemblyName System.Drawing

$srcPath = "E:\Mobile_app\RiseRiot_app\RiseRiot\assets\logo\rise_riot logo.jpeg"
$assetsDir = "E:\Mobile_app\RiseRiot_app\RiseRiot\assets"

Write-Host "Loading source image..."
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$srcW = $src.Width
$srcH = $src.Height
$centerX = $srcW / 2.0
$centerY = $srcH / 2.0
$radius = 665.0 # circle boundary

# The dark color inside the circle
$darkColor = [System.Drawing.Color]::FromArgb(255, 16, 17, 21)

Write-Host "Creating seamless 1024x1024 master icon (filling white corners with dark background)..."
# 1. Master cleaned 1600x1600 image where outside the circle is filled with $darkColor with antialiasing
$cleaned = New-Object System.Drawing.Bitmap($srcW, $srcH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cleanedG = [System.Drawing.Graphics]::FromImage($cleaned)
$cleanedG.Clear($darkColor)

# Draw source over it, but mask outside the circle
# We can do this pixel by pixel or with graphics path
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse([float]($centerX - $radius), [float]($centerY - $radius), [float]($radius * 2), [float]($radius * 2))
$cleanedG.SetClip($path)
$cleanedG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$cleanedG.DrawImage($src, 0, 0, $srcW, $srcH)
$cleanedG.ResetClip()
$cleanedG.Dispose()

# Helper function to resize with high quality
function Resize-Image($sourceBmp, $targetW, $targetH, $bgFillColor) {
    $target = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    if ($bgFillColor -ne $null) {
        $g.Clear($bgFillColor)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }
    $g.DrawImage($sourceBmp, 0, 0, $targetW, $targetH)
    $g.Dispose()
    return $target
}

# 1. Generate assets/icon.png (1024x1024 full bleed dark icon)
Write-Host "Generating assets/icon.png..."
$icon1024 = Resize-Image $cleaned 1024 1024 $darkColor
$icon1024.Save("$assetsDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon1024.Dispose()

# 2. Generate assets/splash-icon.png (1024x1024)
Write-Host "Generating assets/splash-icon.png..."
# For splash, emblem centered on transparent or dark background
$splash1024 = Resize-Image $cleaned 1024 1024 $darkColor
$splash1024.Save("$assetsDir\splash-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$splash1024.Dispose()

# 3. Generate assets/android-icon-background.png (512x512 solid dark background)
Write-Host "Generating assets/android-icon-background.png..."
$bg512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bgG = [System.Drawing.Graphics]::FromImage($bg512)
$bgG.Clear($darkColor)
$bgG.Dispose()
$bg512.Save("$assetsDir\android-icon-background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bg512.Dispose()

# 4. Generate assets/android-icon-foreground.png (512x512 transparent background, emblem in safe zone ~68% = 350px)
Write-Host "Generating assets/android-icon-foreground.png..."
# Transparent circle badge
$badgeOnly = New-Object System.Drawing.Bitmap($srcW, $srcH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$badgeG = [System.Drawing.Graphics]::FromImage($badgeOnly)
$badgeG.Clear([System.Drawing.Color]::Transparent)
$badgeG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$badgeG.SetClip($path)
$badgeG.DrawImage($src, 0, 0, $srcW, $srcH)
$badgeG.ResetClip()
$badgeG.Dispose()

$fg512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$fgG = [System.Drawing.Graphics]::FromImage($fg512)
$fgG.Clear([System.Drawing.Color]::Transparent)
$fgG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$fgG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$fgG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Safe zone for adaptive icon is inner 66% (338px diameter). Let's use 380px for high impact without edge clip.
$targetSize = 380
$targetOffset = (512 - $targetSize) / 2
$fgG.DrawImage($badgeOnly, [float]$targetOffset, [float]$targetOffset, [float]$targetSize, [float]$targetSize)
$fgG.Dispose()
$fg512.Save("$assetsDir\android-icon-foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 5. Generate assets/android-icon-monochrome.png (512x512 for Material You themed icons)
Write-Host "Generating assets/android-icon-monochrome.png..."
# Monochrome is white silhouette of the clock and figure on transparent canvas
$mono512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$monoSrc = Resize-Image $badgeOnly $targetSize $targetSize $null
for ($y = 0; $y -lt $targetSize; $y++) {
    for ($x = 0; $x -lt $targetSize; $x++) {
        $c = $monoSrc.GetPixel($x, $y)
        # If it's part of the yellow clock or white figure (brightness > 0.25)
        if ($c.A -gt 30 -and ($c.R -gt 70 -or $c.G -gt 70 -or $c.B -gt 70)) {
            $destX = [int]($targetOffset + $x)
            $destY = [int]($targetOffset + $y)
            if ($destX -ge 0 -and $destX -lt 512 -and $destY -ge 0 -and $destY -lt 512) {
                $mono512.SetPixel($destX, $destY, [System.Drawing.Color]::FromArgb($c.A, 255, 255, 255))
            }
        }
    }
}
$monoSrc.Dispose()
$mono512.Save("$assetsDir\android-icon-monochrome.png", [System.Drawing.Imaging.ImageFormat]::Png)
$mono512.Dispose()
$fg512.Dispose()

# 6. Generate assets/favicon.png (192x192)
Write-Host "Generating assets/favicon.png..."
$fav192 = Resize-Image $cleaned 192 192 $darkColor
$fav192.Save("$assetsDir\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$fav192.Dispose()

$badgeOnly.Dispose()
$cleaned.Dispose()
$src.Dispose()
$path.Dispose()

Write-Host "All assets successfully generated!"
