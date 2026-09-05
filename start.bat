@echo off
echo ============================================
echo   TaskPilot AI - Starting Development Servers
echo ============================================
echo.

:: Start Backend
echo [1/2] Starting Backend (FastAPI on port 8000)...
start "TaskPilot Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend (Vite on port 5173)...
start "TaskPilot Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   Both servers started!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
pause
