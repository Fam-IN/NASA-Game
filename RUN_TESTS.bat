@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (echo Run START_BACKEND.bat once first. & pause & exit /b 1)
".venv\Scripts\python.exe" -m pytest -q
if errorlevel 1 (echo Backend tests failed. & pause & exit /b 1)
cd /d "%~dp0frontend"
call npm run build
pause
