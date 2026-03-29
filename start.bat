@echo off
echo ========================================
echo   SideKick - Starting All Services
echo ========================================

:: Kill anything on our ports
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000 :3000 :8000"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [1/3] Starting Python Matching Service (port 8000)...
start "SideKick Python" cmd /k "cd /d %~dp0python-service && python app.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Node.js Backend (port 5000)...
start "SideKick Backend" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Starting React Frontend (port 3000)...
start "SideKick Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   All services launching in new windows
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000
echo   Python   : http://localhost:8000
echo ========================================
pause
