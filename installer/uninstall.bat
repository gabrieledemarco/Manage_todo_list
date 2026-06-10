@echo off
setlocal
:: ─────────────────────────────────────────────────────────────
:: TaskFlow — Windows Uninstaller
:: Requires: Run as Administrator
:: ─────────────────────────────────────────────────────────────

net session >nul 2>&1
if errorlevel 1 (
    echo Richiede permessi di Amministratore.
    echo Fai clic destro e seleziona "Esegui come amministratore".
    pause & exit /b 1
)

set INSTALL_DIR=C:\Program Files\TaskFlow
set START_MENU=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\TaskFlow

echo.
echo  Disinstallazione di TaskFlow...
echo  ATTENZIONE: il database con i tuoi dati verra' rimosso.
echo.
set /p CONFIRM=Continuare? [S/N]:
if /i not "%CONFIRM%"=="S" (
    echo Operazione annullata.
    pause & exit /b 0
)

:: Stop running instance
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " 2^>nul') do (
    if not "%%a"=="0" taskkill /PID %%a /F >nul 2>&1
)

:: Remove files
if exist "%INSTALL_DIR%" (
    rmdir /s /q "%INSTALL_DIR%"
    echo  File rimossi.
)

:: Remove shortcuts
if exist "%USERPROFILE%\Desktop\TaskFlow.lnk"     del "%USERPROFILE%\Desktop\TaskFlow.lnk"
if exist "%PUBLIC%\Desktop\TaskFlow.lnk"           del "%PUBLIC%\Desktop\TaskFlow.lnk"
if exist "%START_MENU%"                            rmdir /s /q "%START_MENU%"

:: Remove registry entry
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow" /f >nul 2>&1

echo.
echo  TaskFlow e' stato disinstallato.
pause
