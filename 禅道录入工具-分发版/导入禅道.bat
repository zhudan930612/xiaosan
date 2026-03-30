@echo off
setlocal
cd /d "%~dp0"

set "NODE_CMD="
for /f "delims=" %%i in ('where node 2^>nul') do (
  set "NODE_CMD=%%i"
  goto node_found
)

:node_found
if not defined NODE_CMD (
  echo Node.js was not found. Please install Node.js 18 or newer first.
  echo Download: https://nodejs.org/
  pause
  exit /b 1
)

echo ==============================
echo ZenTao Import Tool
echo Version: 2026-03-30.4-share
echo Path: %~dp0
echo.
echo 1. Create stories and tasks
echo    Use 1 when stories do not exist in ZenTao yet.
echo    Result: create stories first, then create tasks.
echo.
echo 2. Create tasks only
echo    Use 2 when stories already exist and only tasks are missing.
echo    Result: do not create stories, only add tasks to existing stories.
echo ==============================
set /p IMPORT_MODE=Select mode ^(1=create stories+tasks, 2=create tasks only^): 

if "%IMPORT_MODE%"=="2" (
  "%NODE_CMD%" src\cli.js --tasks-only
) else (
  "%NODE_CMD%" src\cli.js
)

pause
