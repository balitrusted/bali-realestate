@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    CSV Import
echo ========================================
echo.

if "%~1"=="" (
  echo File: properties.csv (in this folder)
  echo To use another file: drag the CSV onto this .bat
  echo.
  call npx tsx scripts/import-csv.ts
) else (
  echo File: %~1
  echo.
  call npx tsx scripts/import-csv.ts "%~1"
)

echo.
echo ========================================
echo Press any key to close this window...
echo ========================================
pause >nul
