@echo off
setlocal enabledelayedexpansion
net session >nul 2>&1
if errorlevel 1 (echo Richiede permessi di Amministratore. & echo Fai clic destro e seleziona Esegui come amministratore. & pause & exit /b 1)
set BUNDLE_DIR=%~dp0
set INSTALL_DIR=C:\Program Files\TaskFlow
set DATA_DIR=%INSTALL_DIR%\data
set DB_FILE=%DATA_DIR%\taskflow.db
set SEED_DB=%INSTALL_DIR%\prisma\seed.db
set START_MENU=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\TaskFlow
echo.
echo  TaskFlow Installazione - Cartella: %INSTALL_DIR%
echo.
set /p CONFIRM=Procedere? [S/N]:
if /i not "%CONFIRM%"=="S" (echo Annullato. & pause & exit /b 0)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " 2^>nul') do (if not "%%a"=="0" taskkill /PID %%a /F >nul 2>&1)
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
xcopy /E /I /Y /Q "%BUNDLE_DIR%." "%INSTALL_DIR%\"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DB_FILE%" copy "%SEED_DB%" "%DB_FILE%" >nul
powershell -NoProfile -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\TaskFlow.lnk');$s.TargetPath='%INSTALL_DIR%\taskflow.vbs';$s.WorkingDirectory='%INSTALL_DIR%';$s.Description='TaskFlow';$s.Save()"
if not exist "%START_MENU%" mkdir "%START_MENU%"
powershell -NoProfile -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%START_MENU%\TaskFlow.lnk');$s.TargetPath='%INSTALL_DIR%\taskflow.vbs';$s.WorkingDirectory='%INSTALL_DIR%';$s.Save()"
set REG_KEY=HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow
reg add "%REG_KEY%" /v DisplayName /t REG_SZ /d "TaskFlow" /f >nul
reg add "%REG_KEY%" /v DisplayVersion /t REG_SZ /d "0.2.0" /f >nul
reg add "%REG_KEY%" /v UninstallString /t REG_SZ /d "%INSTALL_DIR%\uninstall.bat" /f >nul
reg add "%REG_KEY%" /v InstallLocation /t REG_SZ /d "%INSTALL_DIR%" /f >nul
reg add "%REG_KEY%" /v NoModify /t REG_DWORD /d 1 /f >nul
echo.
echo  Installazione completata! Apri http://localhost:3000
set /p LAUNCH=Avviare TaskFlow adesso? [S/N]:
if /i "%LAUNCH%"=="S" start "" wscript.exe "%INSTALL_DIR%\taskflow.vbs"
pause
