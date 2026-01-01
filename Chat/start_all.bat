@echo off
cd /d "%~dp0"
TITLE LiraOS Launchpad

echo STARTING LIRA OS...
echo Current Directory: %CD%

echo 1. Killing old processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul

echo 2. Starting Python Bridge...
start "Lira Python Bridge" cmd /k "cd backend\python && python game_bridge.py"

echo 3. Starting Backend...
start "Lira Backend" cmd /k "cd backend && npm run dev"

echo 4. Starting Frontend...
start "Lira Frontend" cmd /k "npm run dev"

echo 5. Waiting for services...
timeout /t 5

echo 6. Launching Browser...
start http://localhost:5173/gamer/?debug_auth=true

echo DONE.
pause
