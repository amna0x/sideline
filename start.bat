@echo off
title Sideline App
echo ==========================================
echo Starting Sideline Web Application...
echo ==========================================

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ first.
    echo.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in PATH!
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists in root, client, and server
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

REM Set default environment variables
set AUTO_SIMULATE=1

echo.
echo Starting dev servers (Client + Server)...
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to start application!
)
pause
