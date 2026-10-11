# Draws the MyCalories app icon (green square, white calorie ring, grape leaf)
# and saves it in the sizes iPhone and Android need. Run from the project folder:
#   powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1

Add-Type -AssemblyName System.Drawing

function New-Icon([int]$size, [double]$contentScale) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background: diagonal green gradient, full bleed (iOS rounds the corners itself)
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(255, 46, 176, 104)), ([System.Drawing.Color]::FromArgb(255, 17, 102, 58)), 45.0
    $g.FillRectangle($bg, $rect)

    $c = $size / 2.0
    $u = $size * $contentScale   # content unit

    # Faint full ring + bright 75% arc
    $ringR = 0.36 * $u
    $ringW = 0.085 * $u
    $ringRect = New-Object System.Drawing.RectangleF ([single]($c - $ringR)), ([single]($c - $ringR)), ([single](2 * $ringR)), ([single](2 * $ringR))
    $track = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 255, 255, 255)), ([single]$ringW)
    $g.DrawEllipse($track, $ringRect)
    $arc = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ([single]$ringW)
    $arc.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $arc.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawArc($arc, $ringRect, -90, 270)

    # Leaf (dolma grape leaf) in the middle, tilted
    $leafH = 0.36 * $u
    $leafW = 0.22 * $u
    $state = $g.Save()
    $g.TranslateTransform([single]$c, [single]$c)
    $g.RotateTransform(-35)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $top = [single](-$leafH / 2); $bot = [single]($leafH / 2); $w = [single]($leafW / 2)
    $path.AddBezier([single]0, $top, $w * 1.35, $top * 0.55, $w * 1.35, $bot * 0.55, [single]0, $bot)
    $path.AddBezier([single]0, $bot, -$w * 1.35, $bot * 0.55, -$w * 1.35, $top * 0.55, [single]0, $top)
    $g.FillPath([System.Drawing.Brushes]::White, $path)
    $vein = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 29, 138, 78)), ([single](0.018 * $u))
    $vein.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $vein.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($vein, [single]0, $top * 0.7, [single]0, $bot * 1.25)
    $g.DrawLine($vein, [single]0, [single]0, $w * 0.6, $top * 0.35)
    $g.DrawLine($vein, [single]0, $bot * 0.35, -$w * 0.6, [single]0)
    $g.Restore($state)

    $g.Dispose()
    return $bmp
}

$out = Join-Path (Get-Location) 'icons'
New-Item -ItemType Directory -Force $out | Out-Null
$targets = @(
    @{ name = 'apple-touch-icon.png'; size = 180; scale = 1.0 },
    @{ name = 'icon-192.png'; size = 192; scale = 1.0 },
    @{ name = 'icon-512.png'; size = 512; scale = 1.0 },
    @{ name = 'icon-maskable-512.png'; size = 512; scale = 0.8 }
)
foreach ($t in $targets) {
    $bmp = New-Icon $t.size $t.scale
    $bmp.Save((Join-Path $out $t.name), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "saved icons/$($t.name)"
}
