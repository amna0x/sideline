@echo off
title Sideline - Backend + Frontend

echo ========================================
echo   SIDELINE - Starting all services...
echo ========================================
echo.

:: Start backend server in a new window (0.0.0.0 for LAN access)
start "Sideline Server" cmd /k "cd /d %~dp0server && set AUTO_SIMULATE=1 && set HOST=0.0.0.0 && npm run dev"

:: Give server a moment to boot
timeout /t 2 /nobreak >nul

:: Start frontend dev server in a new window (0.0.0.0 for LAN access)
start "Sideline Client" cmd /k "cd /d %~dp0client && npm run dev -- --host 0.0.0.0"

echo.
echo   Server:  http://0.0.0.0:4000  (LAN accessible)
echo   Client:  http://0.0.0.0:5173  (LAN accessible)
echo.
echo   Access from other devices using your PC's IP address.
echo   Both running in separate windows.
echo   Close this window or press any key to exit.
echo ========================================
pause >nul
