@echo off
echo Starting Compressor services on network...
echo.
timeout /t 2

REM Get the directory where this script is located
cd /d "%~dp0"

REM Start backend in new window
echo Starting backend...
start "backend" cmd /k "cd backend && npm start"
timeout /t 2

REM Start frontend in new window
echo Starting frontend...
start "frontend" cmd /k "cd frontend && npm run dev -- --host"
timeout /t 2
