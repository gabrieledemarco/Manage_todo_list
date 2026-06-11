@echo off
setlocal enabledelayedexpansion
:: ─────────────────────────────────────────────────────────────
:: TaskFlow — Start Server
:: ─────────────────────────────────────────────────────────────
:: This script starts the TaskFlow server directly (no install).
:: Press Ctrl+C to stop.
:: ─────────────────────────────────────────────────────────────

set ROOT=%~dp0
set NODE=%ROOT%node\node.exe
set SERVER=%ROOT%server.js
set DATA_DIR=%ROOT%data
set DB_FILE=%DATA_DIR%\taskflow.db
set SEED_DB=%ROOT%prisma\seed.db
set PORT=3000

:: Verify Node.js binary exists
if not exist "%NODE%" (
    echo [ERROR] Node.js not found at: %NODE%
    echo         The bundle may be corrupted.
    pause & exit /b 1
)

:: Create data directory if missing
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

:: Initialize database on first run (preserves existing data on upgrade)
if not exist "%DB_FILE%" (
    echo Inizializzazione database...
    copy "%SEED_DB%" "%DB_FILE%" >nul
    if errorlevel 1 (
        echo [ERROR] Could not initialize database.
        pause & exit /b 1
    )
    echo Database inizializzato.
) else (
    echo Database esistente rilevato.
)

:: Environment
set DATABASE_URL=file:%DB_FILE%
set NODE_ENV=production
set PORT=%PORT%
set HOSTNAME=127.0.0.1
set NEXT_TELEMETRY_DISABLED=1

:: Apply pending schema migrations (safe on every startup — skips already-applied)
set PRISMA_CLI=%ROOT%node_modules\prisma\build\index.js
if exist "%PRISMA_CLI%" (
    echo Verifica aggiornamenti schema database...
    "%NODE%" "%PRISMA_CLI%" migrate deploy --schema "%ROOT%prisma\schema.prisma" >nul 2>&1
    if errorlevel 1 (
        echo [ATTENZIONE] Impossibile applicare le migrazioni - controllare il log.
    ) else (
        echo Schema database aggiornato.
    )
)

echo.
echo  +------------------------------------------+
echo  ^|  TaskFlow - Gestione Progetti             ^|
echo  ^|  http://localhost:%PORT%                     ^|
echo  ^|  Premi Ctrl+C per fermare il server       ^|
echo  +------------------------------------------+
echo.

cd /d "%ROOT%"
"%NODE%" server.js

echo.
echo Server fermato.
pause
