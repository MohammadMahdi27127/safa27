@echo off
cd /d "%~dp0"
start "safa27-backend" cmd /k "venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"
start "safa27-frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"
