@echo off
title LiraOS Launcher (JS Mode) 🚀

echo.
echo 🧹 Limpando portas com Node.js...
node clean_ports.cjs

echo.
echo [1/4] Iniciando Backend... 🧠
start "LiraOS Brain" /d "backend" npm run dev

echo.
echo [2/4] Iniciando Frontend... 💻
start "LiraOS Interface" npm run dev

echo.
echo [3/4] Iniciando XTTS Server (Voz Neural)... 🗣️
start "LiraOS Voice (XTTS)" /d "backend/tts" cmd /k "venv\Scripts\activate & python server.py"

echo.
echo [4/4] Iniciando RVC Server (Canto/Covers)... 🎵
start "LiraOS Singer (RVC)" /d "backend/rvc" cmd /k "venv\Scripts\activate & python server.py"

echo.
echo [5/5] Iniciando Vision Server (Games/Olhos)... 👁️
start "LiraOS Vision" cmd /k "python backend/python/game_bridge.py"

echo.
echo 🦊 LiraOS Iniciado!
echo.
pause
