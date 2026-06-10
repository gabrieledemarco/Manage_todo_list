@echo off
setlocal
net session >nul 2>&1
if errorlevel 1 (echo Richiede permessi di Amministratore. & pause & exit /b 1)
set INSTALL_DIR=C:\Program Files\TaskFlow
set START_MENU=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\TaskFlow
echo Disinstallazione TaskFlow - I dati verranno rimossi.
set /p CONFIRM=Continuare? [S/N]:
if /i not "%CONFIRM%"=="S" (echo Annullato. & pause & exit /b 0)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " 2^>nul') do (if not "%%a"=="0" taskkill /PID %%a /F >nul 2>&1)
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
if exist "%USERPROFILE%\Desktop\TaskFlow.lnk" del "%USERPROFILE%\Desktop\TaskFlow.lnk"
if exist "%PUBLIC%\Desktop\TaskFlow.lnk" del "%PUBLIC%\Desktop\TaskFlow.lnk"
if exist "%START_MENU%" rmdir /s /q "%START_MENU%"
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\TaskFlow" /f >nul 2>&1
echo TaskFlow disinstallato.
pause
