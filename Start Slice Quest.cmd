@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not on PATH.
  echo Install the LTS version from https://nodejs.org/ then try again.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 (
  echo Slice Quest needs Node.js version 22 or newer.
  echo Install the current LTS version from https://nodejs.org/ then try again.
  pause
  exit /b 1
)
set "PORT=3000"
echo.
echo Slice Quest
echo Open http://localhost:3000 in Edge, Chrome, or Firefox.
echo Keep this window open while playing. Close it to stop the game.
echo Results are saved in the results folder beside this launcher.
echo.
node server.js
if errorlevel 1 echo Could not start the game. Check the error above. Another copy may already be running.
pause
