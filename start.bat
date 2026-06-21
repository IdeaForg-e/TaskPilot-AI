@echo off
title TaskPilot-AI Starter
echo ========================================================
echo          Welcome to TaskPilot-AI Control Panel          
echo ========================================================
echo.

:: 1. Backend Checks
echo [1/3] Checking Backend Virtual Environment...
if not exist "backend\venv\" (
    echo [WARNING] Virtual environment not found. Creating one...
    python -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Please install python.
        pause
        exit /b 1
    )
)
echo [OK] Backend virtual environment verified.

echo [2/3] Checking Backend Python Dependencies...
call backend\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo [OK] Backend dependencies verified.

:: 2. Frontend Checks
echo [3/3] Checking Frontend Node Modules...
if not exist "frontend\node_modules\" (
    echo [WARNING] node_modules not found. Running npm install...
    cd frontend
    call npm install
    cd ..
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)
echo [OK] Frontend node modules verified.

echo.
echo ========================================================
echo            Launching TaskPilot-AI Servers...            
echo ========================================================
echo.

:: Kill any existing process on ports 8000 and 5173 to avoid conflicts
echo Cleaning up existing servers running on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo.

:: Launch Backend
echo Launching Backend (FastAPI on Port 8000)...
start "TaskPilot-AI Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --reload-exclude *.db --reload-exclude *.db-journal --reload-exclude *.log --port 8000"

:: Wait for backend to initialize
echo Waiting 3 seconds for Backend to start...
timeout /t 3 /nobreak > nul

:: Launch Frontend
echo Launching Frontend (Vite on Port 5173)...
start "TaskPilot-AI Frontend" cmd /k "cd frontend && npm run dev"

:: Wait for frontend to initialize
timeout /t 2 /nobreak > nul

:: Force open in Google Chrome
echo Opening dashboard in Google Chrome...
start chrome http://localhost:5173

echo.
echo ========================================================
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:5173
echo ========================================================
echo.
echo Press any key to exit this launcher window...
pause > nul
