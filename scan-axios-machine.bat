@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  Axios Supply Chain Attack — Machine-Wide Scanner
REM  Scans ALL projects and npm cache for compromise indicators
REM  Usage: Right-click > Run with PowerShell, or: powershell -File scan-axios-machine.ps1
REM ============================================================

echo This script must be run in PowerShell for full functionality.
echo Please use scan-axios-machine.ps1 instead.
echo.
echo Run: powershell -ExecutionPolicy Bypass -File scan-axios-machine.ps1
pause
