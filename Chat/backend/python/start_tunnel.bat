@echo off
echo.
echo [LIRA TUNNEL SETUP]
echo This will create a public URL for your local Game Bridge using Serveo.net
echo.
echo 1. If asked about "authenticity of host", type: yes
echo 2. Look for a URL like: https://xxxx.serveo.net
echo 3. Copy that URL.
echo 4. Open Lira: https://liraos.xyz/gamer/?bridge=YOUR_COPIED_URL
echo.
echo Connecting to Satellite...
ssh -o ServerAliveInterval=60 -R 80:localhost:5000 serveo.net
pause
