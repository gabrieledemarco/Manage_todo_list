Option Explicit
Dim fso, scriptDir, shell, port, url
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
port = "3000"
url = "http://localhost:" & port
Dim netsh
Set netsh = shell.Exec("cmd /c netstat -ano | findstr :3000")
netsh.StdOut.ReadAll()
If netsh.ExitCode = 0 Then
    shell.Run url, 1, False
    WScript.Quit 0
End If
shell.Run "cmd /c """ & scriptDir & "\start.bat""", 0, False
Dim i, http
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
For i = 1 To 15
    WScript.Sleep 1000
    On Error Resume Next
    http.Open "GET", url, False
    http.Send
    If Err.Number = 0 And http.Status = 200 Then Exit For
    On Error GoTo 0
Next
shell.Run url, 1, False
WScript.Quit 0
