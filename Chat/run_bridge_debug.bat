@echo off
cd backend
echo Checking Python...
python --version
echo.
echo Installing Requirements (Global)...
pip install flask flask-cors pywin32 mss opencv-python numpy vgamepad keyboard
echo.
echo Starting Game Bridge...
python python/game_bridge.py
pause
