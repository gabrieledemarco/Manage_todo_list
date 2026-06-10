' ─────────────────────────────────────────────────────────────
' TaskFlow — Silent Launcher (no command window)
' Double-click this file to start TaskFlow in the background
' and open it automatically in the browser.
' ─────────────────────────────────────────────────────────────
Option Explicit

Dim fso, scriptDir, shell, port, url

Set fso    = CreateObject("Scripting.FileSystemObject")
Set shell  = CreateObject("WScript.Shell")

scriptDir  = fso.GetParentFolderName(WScript.ScriptFullName)
port       = "3000"
url        = "http://localhost:" & port

' Check if already running on port 3000
Dim netsh, result
Set netsh = shell.Exec("cmd /c netstat -ano | findstr :3000")
netsh.StdOut.ReadAll()  ' drain output
If netsh.ExitCode = 0 Then
    ' Already running — just open the browser
    shell.Run url, 1, False
    WScript.Quit 0
End If

' Start the server (hidden window)
shell.Run "cmd /c """ & scriptDir & "\start.bat""", 0, False

' Wait for server to be ready (up to 15 seconds)
Dim i, http, ready
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
ready    = False
For i = 1 To 15
    WScript.Sleep 1000
    On Error Resume Next
    http.Open "GET", url, False
    http.Send
    If Err.Number = 0 And http.Status = 200 Then
        ready = True
        Exit For
    End If
    On Error GoTo 0
Next

' Open browser
shell.Run url, 1, False

WScript.Quit 0
