@echo off
chcp 65001 >nul
cd /d "%~dp0"

if exist ".next\dev\lock" (
  del ".next\dev\lock"
  echo Cleared old lock file.
)

echo Starting dev server...
echo.
echo When you see "Ready" below, open in browser:
echo   http://localhost:3000
echo   or  http://localhost:3001  if 3000 is busy
echo.
echo To stop: close this window or press Ctrl+C
echo.
npm run dev
pause
