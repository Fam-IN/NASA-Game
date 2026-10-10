@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
  echo [PARADOX] Setting up Python environment...
  py -3 -m venv .venv
  if errorlevel 1 (echo Python 3 is required. & pause & exit /b 1)
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 (echo Dependency installation failed. & pause & exit /b 1)
)
echo [PARADOX] Backend: http://127.0.0.1:8000/docs
".venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
