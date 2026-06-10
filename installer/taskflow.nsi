; =============================================================================
; TaskFlow — NSIS Installer Script
; =============================================================================
; Compile with: makensis installer/taskflow.nsi
; (after running build-portable.sh/bat which creates dist/taskflow-windows-v0.2.0/)
;
; Requirements: NSIS 3.x (https://nsis.sourceforge.io/)
; Output: dist/TaskFlow-Setup-v0.2.0.exe
; =============================================================================

!define APP_NAME     "TaskFlow"
!define APP_VERSION  "0.2.0"
!define APP_PUBLISHER "TaskFlow"
!define APP_URL      "http://localhost:3000"
!define BUNDLE_DIR   "..\dist\taskflow-windows-v${APP_VERSION}"
!define INSTALL_DIR  "$PROGRAMFILES64\${APP_NAME}"
!define REG_KEY      "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

; ── Installer metadata ────────────────────────────────────────────────────────
Name "${APP_NAME} ${APP_VERSION}"
OutFile "..\dist\${APP_NAME}-Setup-v${APP_VERSION}.exe"
InstallDir "${INSTALL_DIR}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "InstallPath"
RequestExecutionLevel admin
Unicode True
SetCompressor /SOLID lzma
SetCompressorDictSize 32

; ── Modern UI ─────────────────────────────────────────────────────────────────
!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON     "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON   "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Italian"

; ── Install section ───────────────────────────────────────────────────────────
Section "Install" SecMain
    SetOutPath "$INSTDIR"

    ; Stop any running instance on port 3000
    nsExec::ExecToLog 'cmd /c for /f "tokens=5" %a in (''netstat -ano ^| findstr ":3000 "'') do taskkill /PID %a /F'

    ; Copy all bundle files
    File /r "${BUNDLE_DIR}\*.*"

    ; Create data directory
    CreateDirectory "$INSTDIR\data"

    ; Initialize database from seed
    IfFileExists "$INSTDIR\data\taskflow.db" db_exists db_missing
    db_missing:
        CopyFiles "$INSTDIR\prisma\seed.db" "$INSTDIR\data\taskflow.db"
    db_exists:

    ; Desktop shortcut
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" \
        "$INSTDIR\taskflow.vbs" "" \
        "$INSTDIR\node\node.exe" 0 \
        SW_SHOWNORMAL "" "${APP_NAME} - Gestione Progetti"

    ; Start Menu
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" \
        "$INSTDIR\taskflow.vbs" "" \
        "$INSTDIR\node\node.exe" 0 \
        SW_SHOWNORMAL "" "${APP_NAME} - Gestione Progetti"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\Disinstalla ${APP_NAME}.lnk" \
        "$INSTDIR\Uninstall.exe"

    ; Write uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Register Add/Remove Programs
    WriteRegStr   HKLM "${REG_KEY}" "DisplayName"     "${APP_NAME}"
    WriteRegStr   HKLM "${REG_KEY}" "DisplayVersion"  "${APP_VERSION}"
    WriteRegStr   HKLM "${REG_KEY}" "Publisher"       "${APP_PUBLISHER}"
    WriteRegStr   HKLM "${REG_KEY}" "InstallLocation" "$INSTDIR"
    WriteRegStr   HKLM "${REG_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegDWORD HKLM "${REG_KEY}" "NoModify"        1
    WriteRegDWORD HKLM "${REG_KEY}" "NoRepair"        1

    ; Save install path
    WriteRegStr HKLM "Software\${APP_NAME}" "InstallPath" "$INSTDIR"
SectionEnd

; ── Uninstall section ─────────────────────────────────────────────────────────
Section "Uninstall"
    ; Stop running instance
    nsExec::ExecToLog 'cmd /c for /f "tokens=5" %a in (''netstat -ano ^| findstr ":3000 "'') do taskkill /PID %a /F'

    ; Remove files (preserves data directory)
    RMDir /r "$INSTDIR\node"
    RMDir /r "$INSTDIR\.next"
    RMDir /r "$INSTDIR\node_modules"
    RMDir /r "$INSTDIR\prisma"
    RMDir /r "$INSTDIR\public"
    Delete "$INSTDIR\server.js"
    Delete "$INSTDIR\start.bat"
    Delete "$INSTDIR\install.bat"
    Delete "$INSTDIR\uninstall.bat"
    Delete "$INSTDIR\taskflow.vbs"
    Delete "$INSTDIR\Uninstall.exe"
    ; Note: $INSTDIR\data is preserved (user data)
    RMDir  "$INSTDIR"  ; removes only if empty

    ; Shortcuts
    Delete "$DESKTOP\${APP_NAME}.lnk"
    RMDir /r "$SMPROGRAMS\${APP_NAME}"

    ; Registry
    DeleteRegKey HKLM "${REG_KEY}"
    DeleteRegKey HKLM "Software\${APP_NAME}"
SectionEnd
