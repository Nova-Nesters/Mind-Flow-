@echo off
setlocal

REM Ensure Node.js binaries are available in this session
set "PATH=C:\Program Files\nodejs;%PATH%"

if not exist "C:\Program Files\nodejs\node.exe" (
  echo Node.js was not found at C:\Program Files\nodejs\node.exe
  echo Install Node.js LTS from https://nodejs.org/en/download and try again.
  pause
  exit /b 1
)

cd /d "%~dp0"
"C:\Program Files\nodejs\npm.cmd" run software-size

endlocal
