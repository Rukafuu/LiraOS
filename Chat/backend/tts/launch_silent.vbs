
Set WshShell = CreateObject("WScript.Shell")
' Get current directory
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Change to current directory
WshShell.CurrentDirectory = currentDir
' Run python server invisibly
WshShell.Run "cmd /c venv\Scripts\activate & python server.py", 0
Set WshShell = Nothing
