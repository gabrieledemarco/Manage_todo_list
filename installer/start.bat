@echo off
setlocal enabledelayedexpansion
:: TaskFlow — Start Server
set ROOT=%~dp0
set NODE=%ROOT%node\node.exe
set DATA_DIR=%ROOT%data
set DB_FILE=%DATA_DIR%\taskflow.db
set SEED_DB=%ROOT%prisma\seed.db
set PORT=3000
if not exist "%NODE%" (echo [ERROR] Node.js not found & pause & exit /b 1)
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DB_FILE%" (echo Initializing database... & copy "%SEED_DB%" "%DB_FILE%" >nul)
set DATABASE_URL=file:%DB_FILE%
set NODE_ENV=production
set PORT=%PORT%
set HOSTNAME=127.0.0.1
set NEXT_TELEMETRY_DISABLED=1
echo.
echo  TaskFlow - http://localhost:%PORT% - Premi Ctrl+C per fermare
echo.
cd /d "%ROOT%"
"%NODE%" server.js
echo.
echo Server fermato.
pause
