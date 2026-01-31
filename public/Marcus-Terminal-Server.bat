@echo off
title Marcus AI Terminal Server Manager

:menu
cls
echo.
echo  ========================================
echo   Marcus AI Terminal Server Manager
echo  ========================================
echo.
echo  1. Start Server
echo  2. Stop Server  
echo  3. Check Status
echo  4. Exit
echo.
set /p choice="Select an option (1-4): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto status
if "%choice%"=="4" goto exit
goto menu

:start
echo.
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    goto menu
)

echo ✅ Node.js found
echo.
echo Creating directory...
if not exist "%USERPROFILE%\marcus-ai" mkdir "%USERPROFILE%\marcus-ai"

echo.
echo Downloading terminal server...
cd /d "%USERPROFILE%\marcus-ai"
powershell -Command "Invoke-WebRequest -Uri 'https://marcus-ai-fb9bb.web.app/terminal-server.cjs' -OutFile 'terminal-server.cjs'" >nul 2>&1

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to download terminal server
    echo Please check your internet connection
    pause
    goto menu
)

echo ✅ Terminal server downloaded successfully!
echo.
echo Starting server...
start "Marcus Terminal Server" cmd /k "node terminal-server.cjs"

echo.
echo 🚀 Terminal server started!
echo Server is running on: http://localhost:3001
echo.
echo You can now use terminal commands in Marcus AI!
echo.
echo To stop the server, close the server window or use option 2.
pause
goto menu

:stop
echo.
echo Stopping terminal server...
taskkill /f /im node.exe >nul 2>&1
echo ✅ Terminal server stopped!
pause
goto menu

:status
echo.
echo Checking server status...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Terminal Server Status: RUNNING
    echo Server is active on: http://localhost:3001
    echo Marcus AI terminal commands are working!
) else (
    echo ❌ Terminal Server Status: NOT RUNNING
    echo Server is not responding on: http://localhost:3001
    echo Click option 1 to start the server.
)
echo.
pause
goto menu

:exit
echo.
echo Goodbye!
exit
