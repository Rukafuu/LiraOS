@echo off
title LiraOS Voice Driver Installer 🔊
echo.
echo ========================================================
echo        INSTALADOR DO DRIVER DE VOZ (LIRA OS)
echo ========================================================
echo.
echo Este script fará com que o servidor de voz (XTTS) inicie
echo automaticamente com o Windows, de forma invisivel.
echo.
echo Copiando arquivo para shell:startup...
copy "launch_silent.vbs" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LiraVoiceDriver.vbs"
echo.
if %errorlevel% equ 0 (
    echo [SUCESSO] Driver instalado com sucesso! ✅
    echo O servidor de voz iniciara automaticamente no proximo reinicio.
    echo.
    echo Para iniciar agora mesmo, execute o arquivo 'launch_silent.vbs'.
) else (
    echo [ERRO] Falha ao copiar arquivo. Tente executar como Administrador. ❌
)
echo.
pause
