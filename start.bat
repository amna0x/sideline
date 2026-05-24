@echo off
title Sideline App
echo ==========================================
echo  Starting Sideline Web Application...
echo ==========================================

REM --- Pre-flight: tooling ---
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    echo.
    pause
    exit /b 1
)

REM --- Pre-flight: install deps if missing ---
if not exist node_modules (
    echo node_modules not found in root. Running npm install...
    call npm install
)
if not exist client\node_modules (
    echo client node_modules not found. Installing...
    call npm install --prefix client
)
if not exist server\node_modules (
    echo server node_modules not found. Installing...
    call npm install --prefix server
)

REM --- Pre-flight: free up dev ports (4000 server, 5173 vite) ---
REM Without this the server fails with EADDRINUSE on every restart because
REM "node --watch" sometimes leaves orphans on Windows.
call :kill_port 4000
call :kill_port 5173

REM --- Default env ---
set AUTO_SIMULATE=1

echo.
echo Starting dev servers (Client + Server)...
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to start application.
)
pause
exit /b %ERRORLEVEL%

REM ------------------------------------------------------------
:kill_port
REM Usage: call :kill_port <port>
REM Quietly kills any process LISTENING on the given port.
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"LISTENING" ^| findstr ":%~1 "') do (
    echo Port %~1 in use by PID %%P, terminating...
    taskkill /F /PID %%P >nul 2>nul
)
exit /b 0
