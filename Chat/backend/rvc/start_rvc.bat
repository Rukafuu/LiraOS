@echo off
title Servidor RVC - LiraOS 🦊
echo ==========================================
echo    INICIANDO SERVIDOR RVC (Singing)
echo ==========================================
echo.

cd /d "%~dp0"

if not exist "venv" (
    echo [ERROR] Ambiente virtual nao encontrado!
    echo Rode o install_rvc.bat primeiro.
    pause
    exit
)

echo Ativando venv...
call venv\Scripts\activate

echo Iniciando servidor Python...
python server.py

pause
