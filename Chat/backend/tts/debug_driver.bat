@echo off
title Debug Voz LiraOS
color 0A
echo.
echo ===========================================
echo   DIAGNOSTICO DE VOZ v2 (LIRA OS)
echo ===========================================
echo.
echo Diretorio de trabalho: %~dp0
cd /d "%~dp0"

echo [1/3] Verificando ambiente Python...
if exist venv (
    echo     - Usando 'venv'
    call venv\Scripts\activate
) else if exist .venv (
    echo     - Usando '.venv'
    call .venv\Scripts\activate
) else (
    echo     [!] Nenhum 'venv' encontrado. Tentando usar Python global...
)

echo.
echo [2/3] Versao do Python:
python --version
if %errorlevel% neq 0 (
    echo [ERRO CRITICO] Python nao encontrado no PATH ou no venv!
    echo Instale o Python 3.10+ e marque "Add to PATH".
    goto :end
)



echo.
echo [3/4] Verificando Dependencias...
python -u check_deps.py
if %errorlevel% neq 0 (
    echo [ERRO] Falha na verificacao de dependencias.
    goto :end
)

echo.
echo [4/4] Iniciando Servidor XTTS...
echo -------------------------------------------
python -u server.py
echo -------------------------------------------

echo.
echo O servidor encerrou.

:end
echo.
echo Pressione qualquer tecla para sair...
pause
cmd /k
