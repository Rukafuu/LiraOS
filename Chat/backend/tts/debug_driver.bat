@echo off
title Debug Voz LiraOS
echo ===========================================
echo   DIAGNOSTICO DE VOZ (LIRA OS)
echo ===========================================
echo.
echo Tentando iniciar o servidor XTTS manualmente...
echo Se houver erro, ele aparecera abaixo.
echo.

cd /d "%~dp0"

if not exist venv (
    echo [ERRO] Pasta 'venv' nao encontrada!
    echo Voce precisa instalar as dependencias primeiro (start_lira.bat ou install.bat).
    pause
    exit
)

call venv\Scripts\activate
python server.py

echo.
echo ===========================================
echo O SERVIDOR PAROU. LEIA O ERRO ACIMA.
echo ===========================================
pause
