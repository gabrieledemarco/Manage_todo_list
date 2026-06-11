@echo off
setlocal enabledelayedexpansion
:: ─────────────────────────────────────────────────────────────
:: TaskFlow — Windows Installer
:: Requires: Run as Administrator
:: ─────────────────────────────────────────────────────────────

:: Check for admin rights
net session >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERRORE] Questo installer richiede i permessi di Amministratore.
    echo  Fai clic destro su install.bat e seleziona "Esegui come amministratore".
    echo.
    pause & exit /b 1
)

set BUNDLE_DIR=%~dp0
set INSTALL_DIR=C:\Program Files\TaskFlow
set DATA_DIR=%INSTALL_DIR%\data
set DB_FILE=%DATA_DIR%\taskflow.db
set SEED_DB=%INSTALL_DIR%\prisma\seed.db
set START_MENU=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\TaskFlow

echo.
echo  +------------------------------------------+
echo  ^|  TaskFlow — Installazione                 ^|
echo  +------------------------------------------+
echo.
echo  Cartella di installazione: %INSTALL_DIR%
echo.

:: Confirm
set /p CONFIRM=Procedere con l'installazione? [S/N]:
if /i not "%CONFIRM%"=="S" (
    echo Installazione annullata.
    pause & exit /b 0
)

:: ── Stop existing instance (if any) ──────────────────────────
echo.
echo [1/5] Verifica istanze in esecuzione...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " 2^>nul') do (
    if not "%%a"=="0" (
        echo  Arresto istanza precedente (PID %%a)...
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: ── Copy files ────────────────────────────────────────────────
echo [2/5] Copia dei file...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
xcopy /E /I /Y /Q "%BUNDLE_DIR%." "%INSTALL_DIR%\"
if errorlevel 1 (
    echo [ERRORE] Impossibile copiare i file.
    pause & exit /b 1
)

:: ── Initialize / preserve database ───────────────────────────
echo [3/5] Inizializzazione database...
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DB_FILE%" (
    copy "%SEED_DB%" "%DB_FILE%" >nul
    echo  Database inizializzato.
) else (
    echo  [INFO] Versione precedente rilevata - i dati esistenti vengono preservati.
    echo         Le migrazioni dello schema verranno applicate automaticamente al prossimo avvio.
)

:: ── Create shortcuts ──────────────────────────────────────────
echo [4/5] Creazione collegamenti...

:: Desktop shortcut (current user)
powershell -NoProfile -Command ^
  "$s = (New-Object -COM WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop') + '\TaskFlow.lnk'); " ^
  "$s.TargetPath = '%INSTALL_DIR%\taskflow.vbs'; " ^
  "$s.WorkingDirectory = '%INSTALL_DIR%'; " ^
  "$s.Description = 'TaskFlow - Gestione Progetti'; " ^
  "$s.Save()"

:: Start Menu folder
if not exist "%START_MENU%" mkdir "%START_MENU%"

powershell -NoProfile -Command ^
  "$s = (New-Object -COM WScript.Shell).CreateShortcut('%START_MENU%\TaskFlow.lnk'); " ^
  "$s.TargetPath = '%INSTALL_DIR%\taskflow.vbs'; " ^
  "$s.WorkingDirectory = '%INSTALL_DIR%'; " ^
  "$s.Description = 'TaskFlow - Gestione Progetti'; " ^
  "$s.Save()"

powershell -NoProfile -Command ^
  "$s = (New-Object -COM WScript.Shell).CreateShortcut('%START_MENU%\Disinstalla TaskFlow.lnk'); " ^
  "$s.TargetPath = '%INSTALL_DIR%\uninstall.bat'; " ^
  "$s.WorkingDirectory = '%INSTALL_DIR%'; " ^
  "$s.Save()"

:: ── Register with Add/Remove Programs ────────────────────────
echo [5/5] Registrazione nel sistema...
set REG_KEY=HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow
reg add "%REG_KEY%" /v DisplayName     /t REG_SZ   /d "TaskFlow"                         /f >nul
reg add "%REG_KEY%" /v DisplayVersion  /t REG_SZ   /d "0.3.0"                            /f >nul
reg add "%REG_KEY%" /v Publisher       /t REG_SZ   /d "TaskFlow"                         /f >nul
reg add "%REG_KEY%" /v InstallLocation /t REG_SZ   /d "%INSTALL_DIR%"                   /f >nul
reg add "%REG_KEY%" /v UninstallString /t REG_SZ   /d "%INSTALL_DIR%\uninstall.bat"     /f >nul
reg add "%REG_KEY%" /v NoModify        /t REG_DWORD /d 1                                 /f >nul
reg add "%REG_KEY%" /v NoRepair        /t REG_DWORD /d 1                                 /f >nul

echo.
echo  +------------------------------------------+
echo  ^|  Installazione completata!                ^|
echo  ^|                                           ^|
echo  ^|  - Collegamento sul Desktop creato        ^|
echo  ^|  - Collegamento nel Menu Start creato     ^|
echo  ^|  - Visibile in "Aggiungi/Rimuovi App"     ^|
echo  ^|                                           ^|
echo  ^|  Avvia TaskFlow: doppio clic sull'icona   ^|
echo  ^|  Poi apri: http://localhost:3000          ^|
echo  +------------------------------------------+
echo.

set /p LAUNCH=Avviare TaskFlow adesso? [S/N]:
if /i "%LAUNCH%"=="S" (
    start "" wscript.exe "%INSTALL_DIR%\taskflow.vbs"
)

pause
