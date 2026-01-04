@echo off
set /p PORT="Digite a Porta LAN do Minecraft (ex: 51234): "
echo.

if not exist "ngrok.exe" (
    echo [Baixando Ngrok...]
    powershell -Command "Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip'"
    echo [Extraindo...]
    powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath . -Force"
    del ngrok.zip
)

echo.
echo [VERIFICACAO DE TOKEN]
echo Se voce ja configurou o token, apenas pressione ENTER abaixo.
echo Se nao configurou no PC, cole seu TOKEN do dashboard.ngrok.com agora.
echo.
set /p TOKEN="Cole o AuthToken (ou ENTER para pular): "

if not "%TOKEN%"=="" (
    ngrok config add-authtoken %TOKEN%
    echo Token salvo!
)

echo.
echo -------------------------------------------------------
echo O Ngrok vai abrir em uma nova janela ou abaixo.
echo Copie o endereco que tem 'tcp://' (ex: 0.tcp.ngrok.io:12345)
echo No GamerModal, use APENAS: 0.tcp.ngrok.io:12345
echo -------------------------------------------------------
echo.
ngrok tcp %PORT%
pause
