# ============================================================
#  Axios Supply Chain Attack - Machine-Wide Scanner
#  Scans ALL projects and npm cache for compromise indicators
#
#  Compromised versions: axios 1.14.1, axios 0.30.4
#  Malicious dependency: plain-crypto-js
#
#  Usage: Right-click > Run with PowerShell
#     or: powershell -ExecutionPolicy Bypass -File scan-axios-machine.ps1
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

# --- Config ---
$compromisedVersions = @("1.14.1", "0.30.4")
$maliciousPackages = @("plain-crypto-js")
$scanRoots = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE\OneDrive\Desktop",
    "$env:USERPROFILE\OneDrive\Documents",
    "$env:USERPROFILE\source",
    "$env:USERPROFILE\repos",
    "$env:USERPROFILE\projects",
    "C:\Projects",
    "C:\dev",
    "C:\repos",
    "C:\work",
    "D:\Projects",
    "D:\dev",
    "D:\repos"
)
$npmCachePath = "$env:APPDATA\npm-cache\_cacache"
$npmGlobalPath = "$env:APPDATA\npm\node_modules"

# --- State ---
$findings = @()
$dirsScanned = 0
$nodeModulesFound = 0
$lockFilesChecked = 0
$startTime = Get-Date

# --- Header ---
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AXIOS SUPPLY CHAIN ATTACK - MACHINE-WIDE SCANNER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Machine:    $env:COMPUTERNAME" -ForegroundColor Gray
Write-Host "  User:       $env:USERNAME" -ForegroundColor Gray
Write-Host "  Date:       $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "  Checking:   axios 1.14.1, 0.30.4, plain-crypto-js" -ForegroundColor Gray
Write-Host ""

# --- Helper: Check a single node_modules directory ---
function Check-NodeModules {
    param([string]$Path)

    $projectDir = Split-Path $Path -Parent
    $script:nodeModulesFound++

    # Check 1: Malicious packages
    foreach ($pkg in $maliciousPackages) {
        $pkgPath = Join-Path $Path $pkg
        if (Test-Path $pkgPath) {
            $script:findings += [PSCustomObject]@{
                Severity = "CRITICAL"
                Location = $projectDir
                Detail   = "Malicious package '$pkg' found in node_modules"
            }
            Write-Host "  !!! CRITICAL !!! $pkg found in: $projectDir" -ForegroundColor Red
        }
    }

    # Check 2: Axios version
    $axiosPkg = Join-Path $Path "axios\package.json"
    if (Test-Path $axiosPkg) {
        try {
            $axiosJson = Get-Content $axiosPkg -Raw | ConvertFrom-Json
            $ver = $axiosJson.version
            if ($compromisedVersions -contains $ver) {
                $script:findings += [PSCustomObject]@{
                    Severity = "CRITICAL"
                    Location = $projectDir
                    Detail   = "Compromised axios version $ver installed"
                }
                Write-Host "  !!! CRITICAL !!! axios $ver in: $projectDir" -ForegroundColor Red
            } else {
                Write-Host "  [OK] axios $ver in: $projectDir" -ForegroundColor Green
            }
        } catch {
            Write-Host "  [WARN] Could not read axios version in: $projectDir" -ForegroundColor Yellow
        }
    }
}

# --- Helper: Check lock files for compromise indicators ---
function Check-LockFile {
    param([string]$Path)

    $script:lockFilesChecked++
    $projectDir = Split-Path $Path -Parent
    $content = Get-Content $Path -Raw

    foreach ($pkg in $maliciousPackages) {
        if ($content -match [regex]::Escape($pkg)) {
            $script:findings += [PSCustomObject]@{
                Severity = "CRITICAL"
                Location = $projectDir
                Detail   = "'$pkg' referenced in $(Split-Path $Path -Leaf)"
            }
            Write-Host "  !!! CRITICAL !!! $pkg in lock file: $Path" -ForegroundColor Red
        }
    }

    # Check for compromised axios versions in lock file
    foreach ($ver in $compromisedVersions) {
        # Match patterns like "axios": { "version": "1.14.1" or "axios@1.14.1"
        if ($content -match "axios.*$([regex]::Escape($ver))") {
            $script:findings += [PSCustomObject]@{
                Severity = "WARNING"
                Location = $projectDir
                Detail   = "axios $ver referenced in $(Split-Path $Path -Leaf)"
            }
            Write-Host "  !!! WARNING !!! axios $ver in lock file: $Path" -ForegroundColor Yellow
        }
    }
}

# ============================================================
# PHASE 1: Scan project directories
# ============================================================
Write-Host "--- PHASE 1: Scanning project directories ---" -ForegroundColor Cyan
Write-Host ""

foreach ($root in $scanRoots) {
    if (-not (Test-Path $root)) {
        Write-Host "  [SKIP] $root (does not exist)" -ForegroundColor DarkGray
        continue
    }

    Write-Host "  [SCAN] $root" -ForegroundColor White

    # Find all node_modules directories (skip nested node_modules)
    $nodeModuleDirs = Get-ChildItem -Path $root -Directory -Recurse -Filter "node_modules" -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch "node_modules.*node_modules" -and
            $_.FullName -notmatch "\.git"
        }

    foreach ($nm in $nodeModuleDirs) {
        $script:dirsScanned++
        Write-Host "    [CHECK] $($nm.FullName)" -ForegroundColor Gray
        Check-NodeModules -Path $nm.FullName
    }

    # Find all lock files (even projects without node_modules)
    $lockFiles = Get-ChildItem -Path $root -Recurse -Include "package-lock.json","yarn.lock","pnpm-lock.yaml" -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch "node_modules"
        }

    foreach ($lf in $lockFiles) {
        Write-Host "    [CHECK] $($lf.FullName)" -ForegroundColor Gray
        Check-LockFile -Path $lf.FullName
    }

    # Find package.json files (catch projects where npm install hasn't been run)
    $packageJsons = Get-ChildItem -Path $root -Recurse -Filter "package.json" -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch "node_modules" -and
            $_.FullName -notmatch "\.git"
        }

    foreach ($pj in $packageJsons) {
        try {
            $pjContent = Get-Content $pj.FullName -Raw
            # Check if package.json references a compromised axios range
            if ($pjContent -match '"axios"') {
                $pjDir = Split-Path $pj.FullName -Parent
                $nmExists = Test-Path (Join-Path $pjDir "node_modules")
                $lockExists = Test-Path (Join-Path $pjDir "package-lock.json")

                if (-not $nmExists -and -not $lockExists) {
                    # Extract the version spec
                    if ($pjContent -match '"axios"\s*:\s*"([^"]+)"') {
                        $axiosSpec = $Matches[1]
                        Write-Host "    [INFO] $pjDir has axios '$axiosSpec' in package.json (npm install NOT run)" -ForegroundColor Yellow
                        $findings += [PSCustomObject]@{
                            Severity = "INFO"
                            Location = $pjDir
                            Detail   = "axios '$axiosSpec' in package.json but npm install not run. Safe for now. Pin to 1.14.0 before installing."
                        }
                    }
                }
            }
        } catch {}
    }
}

Write-Host ""

# ============================================================
# PHASE 2: Check npm global modules
# ============================================================
Write-Host "--- PHASE 2: Scanning npm global modules ---" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $npmGlobalPath) {
    Write-Host "  [SCAN] $npmGlobalPath" -ForegroundColor White
    $script:dirsScanned++
    Check-NodeModules -Path $npmGlobalPath
} else {
    Write-Host "  [SKIP] npm global modules (not found at $npmGlobalPath)" -ForegroundColor DarkGray
}

Write-Host ""

# ============================================================
# PHASE 3: Check npm cache
# ============================================================
Write-Host "--- PHASE 3: Scanning npm cache ---" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $npmCachePath) {
    Write-Host "  [SCAN] $npmCachePath" -ForegroundColor White

    # Search for plain-crypto-js in cache content entries
    $cacheHits = Get-ChildItem -Path $npmCachePath -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -lt 5MB } |
        Select-Object -First 500 |
        ForEach-Object {
            try {
                $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
                if ($c -and $c -match "plain-crypto-js") {
                    $_.FullName
                }
            } catch {}
        } |
        Where-Object { $_ }

    if ($cacheHits) {
        Write-Host "  !!! WARNING !!! plain-crypto-js found in npm cache" -ForegroundColor Yellow
        Write-Host "  Run: npm cache clean --force" -ForegroundColor Yellow
        $findings += [PSCustomObject]@{
            Severity = "WARNING"
            Location = $npmCachePath
            Detail   = "plain-crypto-js traces found in npm cache. Run: npm cache clean --force"
        }
    } else {
        Write-Host "  [OK] No compromise indicators in npm cache" -ForegroundColor Green
    }
} else {
    Write-Host "  [SKIP] npm cache (not found at $npmCachePath)" -ForegroundColor DarkGray
}

# Also check npm cache via CLI
Write-Host "  [SCAN] npm cache ls (via CLI)" -ForegroundColor White
try {
    $npmLs = npm cache ls 2>&1
    if ($npmLs -match "plain-crypto-js") {
        Write-Host "  !!! WARNING !!! plain-crypto-js in npm cache listing" -ForegroundColor Yellow
        Write-Host "  Run: npm cache clean --force" -ForegroundColor Yellow
        $findings += [PSCustomObject]@{
            Severity = "WARNING"
            Location = "npm cache"
            Detail   = "plain-crypto-js found via npm cache ls. Run: npm cache clean --force"
        }
    } else {
        Write-Host "  [OK] npm cache ls clean" -ForegroundColor Green
    }
} catch {
    Write-Host "  [SKIP] npm cache ls not available" -ForegroundColor DarkGray
}

Write-Host ""

# ============================================================
# PHASE 4: Check running processes (active exfiltration)
# ============================================================
Write-Host "--- PHASE 4: Checking running processes ---" -ForegroundColor Cyan
Write-Host ""

$suspiciousProcesses = Get-Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ProcessName -match "node" -or $_.ProcessName -match "npm"
    }

if ($suspiciousProcesses) {
    Write-Host "  [INFO] Node.js processes running:" -ForegroundColor White
    foreach ($proc in $suspiciousProcesses) {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
            Write-Host "    PID $($proc.Id): $cmdLine" -ForegroundColor Gray
        } catch {
            Write-Host "    PID $($proc.Id): $($proc.ProcessName) (command line unavailable)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  [OK] No Node.js processes running" -ForegroundColor Green
}

Write-Host ""

# ============================================================
# RESULTS
# ============================================================
$elapsed = (Get-Date) - $startTime

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SCAN COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Duration:           $([math]::Round($elapsed.TotalSeconds, 1))s" -ForegroundColor Gray
Write-Host "  Directories scanned: $dirsScanned" -ForegroundColor Gray
Write-Host "  node_modules found:  $nodeModulesFound" -ForegroundColor Gray
Write-Host "  Lock files checked:  $lockFilesChecked" -ForegroundColor Gray
Write-Host ""

$criticals = $findings | Where-Object { $_.Severity -eq "CRITICAL" }
$warnings  = $findings | Where-Object { $_.Severity -eq "WARNING" }
$infos     = $findings | Where-Object { $_.Severity -eq "INFO" }

if ($criticals.Count -gt 0) {
    Write-Host "  !!! COMPROMISED !!! $($criticals.Count) critical finding(s)" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    foreach ($f in $criticals) {
        Write-Host "    [CRITICAL] $($f.Location)" -ForegroundColor Red
        Write-Host "               $($f.Detail)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  IMMEDIATE ACTIONS:" -ForegroundColor Red
    Write-Host "    1. Disconnect from network" -ForegroundColor Red
    Write-Host "    2. Do NOT run npm install or any node commands" -ForegroundColor Red
    Write-Host "    3. Report to security team immediately" -ForegroundColor Red
    Write-Host "    4. Rotate ALL credentials (npm tokens, git tokens, env vars)" -ForegroundColor Red
} elseif ($warnings.Count -gt 0) {
    Write-Host "  WARNING: $($warnings.Count) concern(s) found" -ForegroundColor Yellow
    Write-Host ""
    foreach ($f in $warnings) {
        Write-Host "    [WARNING] $($f.Location)" -ForegroundColor Yellow
        Write-Host "              $($f.Detail)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  RESULT: CLEAN" -ForegroundColor Green
    Write-Host "  No compromise indicators found on this machine." -ForegroundColor Green
}

if ($infos.Count -gt 0) {
    Write-Host ""
    Write-Host "  NOTES:" -ForegroundColor White
    foreach ($f in $infos) {
        Write-Host "    [INFO] $($f.Location)" -ForegroundColor White
        Write-Host "           $($f.Detail)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Save report to file
$reportPath = Join-Path $env:USERPROFILE "axios-scan-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$reportLines = @(
    "Axios Supply Chain Attack - Machine Scan Report"
    "================================================"
    "Machine:    $env:COMPUTERNAME"
    "User:       $env:USERNAME"
    "Date:       $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    "Duration:   $([math]::Round($elapsed.TotalSeconds, 1))s"
    "Scanned:    $dirsScanned directories, $nodeModulesFound node_modules, $lockFilesChecked lock files"
    ""
)

if ($findings.Count -eq 0) {
    $reportLines += "RESULT: CLEAN - No compromise indicators found."
} else {
    foreach ($f in $findings) {
        $reportLines += "[$($f.Severity)] $($f.Location) - $($f.Detail)"
    }
}

$reportLines | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "  Report saved to: $reportPath" -ForegroundColor Gray
Write-Host ""

# Keep window open
Read-Host "Press Enter to close"
