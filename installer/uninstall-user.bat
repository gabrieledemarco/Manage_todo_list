@echo off
setlocal
:: ─────────────────────────────────────────────────────────────
:: TaskFlow — Disinstallazione Utente (SENZA permessi Admin)
:: ─────────────────────────────────────────────────────────────

set INSTALL_DIR=%APPDATA%\TaskFlow
set USER_START=%APPDATA%\Microsoft\Windows\Start Menu\Programs\TaskFlow

echo Disinstallazione TaskFlow (cartella utente)...
echo I tuoi dati verranno rimossi.
set /p CONFIRM=Continuare? [S/N]:
if /i not "%CONFIRM%"=="S" (echo Annullato. & pause & exit /b 0)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " 2^>nul') do (
    if not "%%a"=="0" taskkill /PID %%a /F >nul 2>&1
)

if exist "%INSTALL_DIR%"  rmdir /s /q "%INSTALL_DIR%"
if exist "%USERPROFILE%\Desktop\TaskFlow.lnk" del "%USERPROFILE%\Desktop\TaskFlow.lnk"
if exist "%USER_START%"   rmdir /s /q "%USER_START%"
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow" /f >nul 2>&1

echo TaskFlow disinstallato.
pause
