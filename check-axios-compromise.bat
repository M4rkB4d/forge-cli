@echo off
REM Axios Supply Chain Attack Check (March 31, 2026)
REM Usage: check-axios-compromise.bat [project-path]
REM If no path given, checks current directory

setlocal
set "DIR=%~1"
if "%DIR%"=="" set "DIR=%CD%"

echo === Axios Compromise Check ===
echo Checking: %DIR%
echo.

REM Check 1: Is plain-crypto-js present in node_modules?
if exist "%DIR%\node_modules\plain-crypto-js" (
    echo !!! COMPROMISED !!! plain-crypto-js found in node_modules
    echo ACTION: This machine must be treated as fully compromised.
    echo   1. Disconnect from network immediately
    echo   2. Do NOT run any more commands
    echo   3. Report to security team
    exit /b 1
)

REM Check 2: Is it in the lock file?
if exist "%DIR%\package-lock.json" (
    findstr /C:"plain-crypto-js" "%DIR%\package-lock.json" >nul 2>&1
    if not errorlevel 1 (
        echo !!! COMPROMISED !!! plain-crypto-js found in package-lock.json
        exit /b 1
    )
)

REM Check 3: What axios version is installed?
if exist "%DIR%\node_modules\axios\package.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\"" "%DIR%\node_modules\axios\package.json"') do (
        set "AXIOS_VER=%%~a"
        set "AXIOS_VER=!AXIOS_VER: =!"
    )
    setlocal enabledelayedexpansion
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\"" "%DIR%\node_modules\axios\package.json"') do (
        set "VER=%%~a"
        set "VER=!VER: =!"
        echo Installed axios version: !VER!
        if "!VER!"=="1.14.1" (
            echo !!! WARNING !!! Compromised version 1.14.1 detected
            exit /b 1
        )
        if "!VER!"=="0.30.4" (
            echo !!! WARNING !!! Compromised version 0.30.4 detected
            exit /b 1
        )
        echo OK - not a compromised version
    )
    endlocal
) else (
    echo axios not installed in node_modules
)

REM Check 4: What does package.json specify?
if exist "%DIR%\package.json" (
    echo.
    echo package.json axios entry:
    findstr /C:"axios" "%DIR%\package.json"
)

echo.
echo === Result: CLEAN - no compromise indicators found ===
pause
