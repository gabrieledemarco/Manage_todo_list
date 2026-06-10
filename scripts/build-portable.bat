@echo off
setlocal enabledelayedexpansion
:: =============================================================================
:: TaskFlow — Portable Bundle Builder (Windows dev machine)
:: =============================================================================
:: Builds a self-contained Windows bundle with portable Node.js.
:: Run this on your development machine (needs internet access).
::
:: Usage:  build-portable.bat
:: Output: dist\taskflow-windows-v0.2.0.zip
:: =============================================================================

set NODE_VERSION=20.18.3
set APP_VERSION=0.2.0
set BUNDLE_NAME=taskflow-windows-v%APP_VERSION%
set BUNDLE_DIR=dist\%BUNDLE_NAME%

cd /d "%~dp0\.."

echo ===================================================
echo  TaskFlow Portable Builder (Windows)
echo  Node: %NODE_VERSION%  ^|  App: %APP_VERSION%
echo ===================================================

:: ── Step 1: Install dependencies ──────────────────────────────────────────────
echo.
echo [1/7] Installing npm dependencies...
call npm ci
if errorlevel 1 goto :error

:: ── Step 2: Generate Prisma client ───────────────────────────────────────────
echo [2/7] Generating Prisma client (all platforms)...
call npx prisma generate
if errorlevel 1 goto :error

:: ── Step 3: Create seed database ─────────────────────────────────────────────
echo [3/7] Creating seed database...
if exist prisma\seed.db del /f prisma\seed.db
set DATABASE_URL=file:./prisma/seed.db
call npx prisma migrate deploy
if errorlevel 1 goto :error

:: ── Step 4: Build Next.js ─────────────────────────────────────────────────────
echo [4/7] Building Next.js application...
call npm run build
if errorlevel 1 goto :error

:: ── Step 5: Assemble bundle ───────────────────────────────────────────────────
echo [5/7] Assembling portable bundle...
if exist dist rmdir /s /q dist
mkdir "%BUNDLE_DIR%"

xcopy /E /I /Y /Q ".next\standalone\." "%BUNDLE_DIR%\"
if not exist "%BUNDLE_DIR%\.next\static" mkdir "%BUNDLE_DIR%\.next\static"
xcopy /E /I /Y /Q ".next\static\." "%BUNDLE_DIR%\.next\static\"
if exist public (
    xcopy /E /I /Y /Q "public\." "%BUNDLE_DIR%\public\"
)

mkdir "%BUNDLE_DIR%\prisma"
copy prisma\schema.prisma "%BUNDLE_DIR%\prisma\" >nul
xcopy /E /I /Y /Q "prisma\migrations" "%BUNDLE_DIR%\prisma\migrations\"
copy prisma\seed.db "%BUNDLE_DIR%\prisma\" >nul

xcopy /E /I /Y /Q "node_modules\.prisma" "%BUNDLE_DIR%\node_modules\.prisma\"
xcopy /E /I /Y /Q "node_modules\@prisma" "%BUNDLE_DIR%\node_modules\@prisma\"

mkdir "%BUNDLE_DIR%\data"

:: ── Step 6: Download portable Node.js ────────────────────────────────────────
echo [6/7] Downloading portable Node.js %NODE_VERSION% for Windows...
set NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip
set NODE_ZIP=%TEMP%\node-taskflow.zip
set NODE_TMP=%TEMP%\node-taskflow-extracted

powershell -NoProfile -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%'"
if errorlevel 1 goto :error

if exist "%NODE_TMP%" rmdir /s /q "%NODE_TMP%"
powershell -NoProfile -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%NODE_TMP%' -Force"
if errorlevel 1 goto :error

mkdir "%BUNDLE_DIR%\node"
copy "%NODE_TMP%\node-v%NODE_VERSION%-win-x64\node.exe" "%BUNDLE_DIR%\node\" >nul
rmdir /s /q "%NODE_TMP%"
del "%NODE_ZIP%"

:: Copy launcher scripts
copy installer\start.bat "%BUNDLE_DIR%\" >nul
copy installer\install.bat "%BUNDLE_DIR%\" >nul
copy installer\uninstall.bat "%BUNDLE_DIR%\" >nul
copy installer\taskflow.vbs "%BUNDLE_DIR%\" >nul

:: ── Step 7: Create ZIP archive ────────────────────────────────────────────────
echo [7/7] Creating archive...
powershell -NoProfile -Command "Compress-Archive -Path '%BUNDLE_DIR%' -DestinationPath 'dist\%BUNDLE_NAME%.zip' -Force"
if errorlevel 1 goto :error

echo.
echo ===================================================
echo  Bundle ready: dist\%BUNDLE_NAME%.zip
echo ===================================================
echo.
echo  Next steps:
echo   1. Transfer dist\%BUNDLE_NAME%.zip to the target PC
echo   2. Extract the ZIP
echo   3. Right-click install.bat, select "Run as administrator"
echo      OR double-click start.bat to run without installing
echo   4. Open http://localhost:3000 in the browser
echo.
goto :end

:error
echo.
echo ERROR: Build failed at the step above.
exit /b 1

:end
endlocal
