@echo off
cd /d "%~dp0frontend"
if not exist "node_modules\vite" (
  echo [PARADOX] Installing frontend dependencies...
  call npm ci
  if errorlevel 1 (echo Dependency installation failed. & pause & exit /b 1)
)
echo [PARADOX] Frontend: http://localhost:5173
call npm run dev -- --host localhost
pause
