@echo off
title LiraOS Voice Driver Installer 🔊
echo.
echo ========================================================
echo        INSTALADOR DE DRIVER - LIRA OS / XTTS
echo ========================================================
echo.
echo Configurando inicializacao automatica...

set "SCRIPT_PATH=%~dp0launch_silent.vbs"
set "WORK_DIR=%~dp0"
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LiraVoiceDriver.lnk"

echo.
echo [1/3] Localizando arquivos...
echo Script: %SCRIPT_PATH%
echo Pasta:  %WORK_DIR%

echo.
echo [2/3] Criando atalho inteligente...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%SCRIPT_PATH%'; $s.WorkingDirectory = '%WORK_DIR%'; $s.Description = 'LiraOS Voice Server'; $s.Save()"

echo.
if exist "%SHORTCUT_PATH%" (
    echo [3/3] Verificando instalacao... OK!
    echo.
    echo [SUCESSO] Driver configurado com sucesso! ✅
    echo ----------------------------------------------------
    echo O servidor de voz iniciara automaticamente com o Windows.
    echo A voz da Lira sera carregada do arquivo 'reference.wav'
    echo localizado nesta mesma pasta.
    echo ----------------------------------------------------
) else (
    echo [ERRO] Falha ao criar atalho. Tente executar como Administrador. ❌
)

echo.
pause
