<#
.SYNOPSIS
    Windows acceptance and smoke verification script for OpenPOS Lite (Tauri 2).
.DESCRIPTION
    Validates installer artifact, launches headless/smoke check, confirms WebView2
    data isolation, and guides tester through manual hardware and route acceptance.
    Compatible with Windows PowerShell 5.1+ and PowerShell Core 7+.
.PARAMETER ExePath
    Explicit path to OpenPOS Lite.exe binary. If omitted, standard install paths are searched.
.PARAMETER InstallerPath
    Explicit path to the NSIS installer executable. If omitted, release-out-lite is searched.
.PARAMETER TimeoutSeconds
    Maximum time to wait for the --smoke process to complete (default 60s).
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ExePath,

    [Parameter(Mandatory = $false)]
    [string]$InstallerPath,

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = 'Continue'
$script:SmokePassed = $false
$script:HasErrors = $false

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      OpenPOS Lite — Windows Acceptance & Smoke Test    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Installer Discovery & Size Validation
# -----------------------------------------------------------------------------
Write-Host ">>> [1/5] Checking Installer Package..." -ForegroundColor Yellow

$resolvedInstaller = $null
if ($InstallerPath -and (Test-Path $InstallerPath)) {
    $resolvedInstaller = (Get-Item $InstallerPath).FullName
} else {
    $searchDirs = @(
        (Join-Path $PSScriptRoot "..\release-out-lite"),
        (Join-Path (Get-Location) "release-out-lite"),
        (Join-Path (Get-Location) "web\release-out-lite")
    )
    foreach ($dir in $searchDirs) {
        if (Test-Path $dir) {
            $candidates = Get-ChildItem -Path $dir -Filter "*setup*.exe" -File -ErrorAction SilentlyContinue
            if ($candidates -and $candidates.Count -gt 0) {
                $resolvedInstaller = $candidates[0].FullName
                break
            }
        }
    }
}

if ($resolvedInstaller -and (Test-Path $resolvedInstaller)) {
    $installerItem = Get-Item $resolvedInstaller
    $installerSizeMB = [math]::Round($installerItem.Length / 1MB, 2)
    Write-Host "  Installer found: $($installerItem.FullName)" -ForegroundColor Green
    Write-Host "  Installer size:  $installerSizeMB MB" -ForegroundColor Green

    if ($installerSizeMB -gt 25.0) {
        Write-Warning "  WARNING: Installer size ($installerSizeMB MB) exceeds 25 MB budget limit!"
    } else {
        Write-Host "  Installer size within budget (<= 25 MB)" -ForegroundColor Green
    }
} else {
    Write-Warning "  Installer not found in standard release-out-lite paths. (Pass -InstallerPath if located elsewhere)"
}
Write-Host ""

# -----------------------------------------------------------------------------
# 2. Executable Discovery
# -----------------------------------------------------------------------------
Write-Host ">>> [2/5] Locating OpenPOS Lite Executable..." -ForegroundColor Yellow

$resolvedExe = $null
if ($ExePath -and (Test-Path $ExePath)) {
    $resolvedExe = (Get-Item $ExePath).FullName
} else {
    $candidatePaths = @(
        (Join-Path $env:LOCALAPPDATA "Programs\OpenPOS Lite\OpenPOS Lite.exe"),
        (Join-Path $env:LOCALAPPDATA "OpenPOS Lite\OpenPOS Lite.exe"),
        (Join-Path $env:ProgramFiles "OpenPOS Lite\OpenPOS Lite.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "OpenPOS Lite\OpenPOS Lite.exe"),
        (Join-Path $PSScriptRoot "..\src-tauri\target\release\OpenPOS Lite.exe"),
        (Join-Path $PSScriptRoot "..\release-out-lite\OpenPOS Lite.exe")
    )

    foreach ($path in $candidatePaths) {
        if ($path -and (Test-Path $path)) {
            $resolvedExe = (Get-Item $path).FullName
            break
        }
    }
}

if (-not $resolvedExe -or -not (Test-Path $resolvedExe)) {
    Write-Host "  ERROR: Could not locate 'OpenPOS Lite.exe' in candidate locations:" -ForegroundColor Red
    Write-Host "    - `$env:LOCALAPPDATA\Programs\OpenPOS Lite\OpenPOS Lite.exe" -ForegroundColor Gray
    Write-Host "    - `$env:LOCALAPPDATA\OpenPOS Lite\OpenPOS Lite.exe" -ForegroundColor Gray
    Write-Host "    - `$env:ProgramFiles\OpenPOS Lite\OpenPOS Lite.exe" -ForegroundColor Gray
    Write-Host "  Please install OpenPOS Lite or specify -ExePath '<path-to-exe>'" -ForegroundColor Red
    $script:HasErrors = $true
} else {
    Write-Host "  Executable located: $resolvedExe" -ForegroundColor Green
}
Write-Host ""

# -----------------------------------------------------------------------------
# 3. Headless Smoke Verification (--smoke)
# -----------------------------------------------------------------------------
Write-Host ">>> [3/5] Executing Smoke Run (OpenPOS Lite.exe --smoke)..." -ForegroundColor Yellow

if ($resolvedExe -and (Test-Path $resolvedExe)) {
    Write-Host "  Launching: `"$resolvedExe`" --smoke (timeout: ${TimeoutSeconds}s)" -ForegroundColor Gray
    try {
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = $resolvedExe
        $pinfo.Arguments = "--smoke"
        $pinfo.UseShellExecute = $false
        $pinfo.RedirectStandardOutput = $true
        $pinfo.RedirectStandardError = $true
        $pinfo.CreateNoWindow = $true

        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $pinfo
        $null = $process.Start()

        $waitSuccess = $process.WaitForExit($TimeoutSeconds * 1000)

        if (-not $waitSuccess) {
            try { $process.Kill() } catch {}
            Write-Host "  SMOKE RESULT: FAIL (Timed out after ${TimeoutSeconds} seconds)" -ForegroundColor Red
            $script:SmokePassed = $false
            $script:HasErrors = $true
        } else {
            $exitCode = $process.ExitCode
            $stdout = $process.StandardOutput.ReadToEnd()
            $stderr = $process.StandardError.ReadToEnd()

            if ($stdout) { Write-Host "  [App stdout] $stdout" -ForegroundColor Gray }
            if ($stderr) { Write-Host "  [App stderr] $stderr" -ForegroundColor DarkGray }

            if ($exitCode -eq 0) {
                Write-Host "  SMOKE RESULT: PASS (Exit code 0)" -ForegroundColor Green
                $script:SmokePassed = $true
            } else {
                Write-Host "  SMOKE RESULT: FAIL (Exit code $exitCode)" -ForegroundColor Red
                $script:SmokePassed = $false
                $script:HasErrors = $true
            }
        }
    } catch {
        Write-Host "  SMOKE RESULT: FAIL (Exception: $($_.Exception.Message))" -ForegroundColor Red
        $script:SmokePassed = $false
        $script:HasErrors = $true
    }
} else {
    Write-Host "  SMOKE RESULT: SKIPPED (Executable unavailable)" -ForegroundColor Red
    $script:SmokePassed = $false
    $script:HasErrors = $true
}
Write-Host ""

# -----------------------------------------------------------------------------
# 4. WebView2 Data Directory Check
# -----------------------------------------------------------------------------
Write-Host ">>> [4/5] Checking WebView2 Data Directory..." -ForegroundColor Yellow

$webView2Locations = @(
    (Join-Path $env:LOCALAPPDATA "com.openpos.lite"),
    (Join-Path $env:LOCALAPPDATA "com.openpos.lite\EBWebView"),
    (Join-Path $env:LOCALAPPDATA "OpenPOS Lite\EBWebView")
)

$foundWebView2Dir = $null
foreach ($dir in $webView2Locations) {
    if ($dir -and (Test-Path $dir)) {
        $foundWebView2Dir = $dir
        break
    }
}

if ($foundWebView2Dir) {
    Write-Host "  WebView2 data directory confirmed: $foundWebView2Dir" -ForegroundColor Green
} else {
    Write-Host "  WebView2 data directory under `$env:LOCALAPPDATA\com.openpos.lite not found yet." -ForegroundColor DarkYellow
    Write-Host "  (Will be initialized on first graphical run by WebView2 runtime)" -ForegroundColor Gray
}
Write-Host ""

# -----------------------------------------------------------------------------
# 5. Manual Acceptance Checklist (Hardware, Routes, Storage)
# -----------------------------------------------------------------------------
Write-Host ">>> [5/5] Manual Acceptance Checklist" -ForegroundColor Yellow
Write-Host "  [NOTE: Thermal printer is NOT automated by this script; test manually]" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  Checklist items to verify in running UI:" -ForegroundColor Cyan
Write-Host "    [ ] 1. Thermal Printing: 58 mm receipt prints cleanly from POS checkout"
Write-Host "    [ ] 2. Excel/CSV Export: File dialog opens, files saved in Produk/Transaksi/Laporan"
Write-Host "    [ ] 3. Backup & Restore: Download JSON backup, restore into clean session"
Write-Host "    [ ] 4. Restart Persistence: Local data retained after closing and reopening app"
Write-Host "    [ ] 5. Offline Routes: All 8 screens load cleanly with 1:1 parity:"
Write-Host "           - /            (Dashboard: KPI, grafik omzet)"
Write-Host "           - /pos         (Kasir: katalog, keranjang, pembayaran tunai/qris)"
Write-Host "           - /produk      (Produk: tambah, edit, hapus, import/export)"
Write-Host "           - /stok        (Stok: filter menipis, penyesuaian manual)"
Write-Host "           - /transaksi   (Transaksi: daftar, detail, refund, export)"
Write-Host "           - /laporan     (Laporan: ringkasan penjualan, export multi-tab)"
Write-Host "           - /pengaturan  (Pengaturan: toko, struk, pajak, timezone)"
Write-Host "           - /backup      (Backup: unduh JSON, pulihkan database)"
Write-Host ""

# -----------------------------------------------------------------------------
# Final Verdict
# -----------------------------------------------------------------------------
if ($script:SmokePassed) {
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "               VERIFICATION STATUS: PASS                " -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "               VERIFICATION STATUS: FAIL                " -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    exit 1
}
