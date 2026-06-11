@echo off
setlocal enabledelayedexpansion
:: ─────────────────────────────────────────────────────────────
:: TaskFlow — Installazione Utente (SENZA permessi Admin)
:: Installa in %APPDATA%\TaskFlow (cartella personale dell'utente)
:: ─────────────────────────────────────────────────────────────

set BUNDLE_DIR=%~dp0
set INSTALL_DIR=%APPDATA%\TaskFlow
set DATA_DIR=%INSTALL_DIR%\data
set DB_FILE=%DATA_DIR%\taskflow.db
set SEED_DB=%INSTALL_DIR%\prisma\seed.db

echo.
echo  +------------------------------------------+
echo  ^|  TaskFlow — Installazione Utente          ^|
echo  ^|  (non richiede permessi Admin)            ^|
echo  ^|  Cartella: %APPDATA%\TaskFlow
echo  +------------------------------------------+
echo.
set /p CONFIRM=Procedere con l'installazione? [S/N]:
if /i not "%CONFIRM%"=="S" (echo Annullato. & pause & exit /b 0)

:: Ferma eventuale istanza in esecuzione
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " 2^>nul') do (
    if not "%%a"=="0" taskkill /PID %%a /F >nul 2>&1
)

:: Copia i file
echo [1/4] Copia dei file...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
xcopy /E /I /Y /Q "%BUNDLE_DIR%." "%INSTALL_DIR%\"
if errorlevel 1 (echo [ERRORE] Impossibile copiare i file. & pause & exit /b 1)

:: Inizializza / preserva database
echo [2/4] Inizializzazione database...
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DB_FILE%" (
    copy "%SEED_DB%" "%DB_FILE%" >nul
    echo  Database inizializzato.
) else (
    echo  [INFO] Versione precedente rilevata - i dati esistenti vengono preservati.
    echo         Le migrazioni dello schema verranno applicate automaticamente al prossimo avvio.
)

:: Collegamento sul Desktop (solo utente corrente - non serve Admin)
echo [3/4] Creazione collegamento Desktop...
powershell -NoProfile -Command ^
  "$s=(New-Object -COM WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\TaskFlow.lnk');$s.TargetPath='%INSTALL_DIR%\taskflow.vbs';$s.WorkingDirectory='%INSTALL_DIR%';$s.Description='TaskFlow - Gestione Progetti';$s.Save()"

:: Collegamento Start Menu utente corrente (non serve Admin)
echo [4/4] Collegamento nel Menu Start...
set USER_START=%APPDATA%\Microsoft\Windows\Start Menu\Programs
if not exist "%USER_START%\TaskFlow" mkdir "%USER_START%\TaskFlow"
powershell -NoProfile -Command ^
  "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USER_START%\TaskFlow\TaskFlow.lnk');$s.TargetPath='%INSTALL_DIR%\taskflow.vbs';$s.WorkingDirectory='%INSTALL_DIR%';$s.Save()"
powershell -NoProfile -Command ^
  "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USER_START%\TaskFlow\Disinstalla TaskFlow.lnk');$s.TargetPath='%INSTALL_DIR%\uninstall-user.bat';$s.WorkingDirectory='%INSTALL_DIR%';$s.Save()"

:: Registrazione in HKCU (solo utente - non serve Admin)
set REG_KEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow
reg add "%REG_KEY%" /v DisplayName     /t REG_SZ   /d "TaskFlow"                              /f >nul
reg add "%REG_KEY%" /v DisplayVersion  /t REG_SZ   /d "0.3.0"                                 /f >nul
reg add "%REG_KEY%" /v InstallLocation /t REG_SZ   /d "%INSTALL_DIR%"                         /f >nul
reg add "%REG_KEY%" /v UninstallString /t REG_SZ   /d "%INSTALL_DIR%\uninstall-user.bat"      /f >nul
reg add "%REG_KEY%" /v NoModify        /t REG_DWORD /d 1                                       /f >nul

echo.
echo  +------------------------------------------+
echo  ^|  Installazione completata!                ^|
echo  ^|                                           ^|
echo  ^|  Cartella: %APPDATA%\TaskFlow
echo  ^|  Collegamento Desktop creato              ^|
echo  ^|  Visibile in "Aggiungi/Rimuovi App"       ^|
echo  ^|                                           ^|
echo  ^|  Avvia: doppio clic sull'icona Desktop    ^|
echo  ^|  Apri:  http://localhost:3000             ^|
echo  +------------------------------------------+
echo.
set /p LAUNCH=Avviare TaskFlow adesso? [S/N]:
if /i "%LAUNCH%"=="S" start "" wscript.exe "%INSTALL_DIR%\taskflow.vbs"
pause
