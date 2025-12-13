@echo off
echo 🧹 ORGANIZANDO PASTA LIRA...
echo.

cd "C:\Users\conta\Documents\Lira"

echo 📁 Criando estrutura organizada...
mkdir organized\liraos-backend 2>nul
mkdir organized\liraos-frontend 2>nul
mkdir organized\liraos-config 2>nul
mkdir organized\liraos-scripts 2>nul
mkdir organized\liraos-docs 2>nul
mkdir organized\liraos-ai 2>nul
mkdir organized\liraos-backups 2>nul
mkdir organized\liraos-misc 2>nul

echo.

echo 🔄 Movendo projetos principais...

REM Backend
if exist "chat-lira-backend" (
    echo 📦 Movendo backend...
    xcopy "chat-lira-backend" "organized\liraos-backend\" /E /I /H /Y >nul
    rmdir /S /Q "chat-lira-backend" 2>nul
)

REM Frontend
if exist "liraos chat v2" (
    echo 🎨 Movendo frontend...
    xcopy "liraos chat v2" "organized\liraos-frontend\" /E /I /H /Y >nul
    rmdir /S /Q "liraos chat v2" 2>nul
)

REM Configurações
echo ⚙️ Movendo configurações...
move ".env" "organized\liraos-config\" 2>nul
move ".gitignore" "organized\liraos-config\" 2>nul
move "DEPLOY_GUIDE.md" "organized\liraos-config\" 2>nul

REM Scripts
echo 📜 Movendo scripts...
move "*.bat" "organized\liraos-scripts\" 2>nul
move "*.py" "organized\liraos-scripts\" 2>nul
move "*.sh" "organized\liraos-scripts\" 2>nul

REM Documentação
echo 📚 Movendo documentação...
move "*.md" "organized\liraos-docs\" 2>nul
move "*.txt" "organized\liraos-docs\" 2>nul

REM AI e modelos
echo 🤖 Movendo AI e modelos...
move "lira" "organized\liraos-ai\" 2>nul
move "kokoro" "organized\liraos-ai\" 2>nul
move "xtts_env" "organized\liraos-ai\" 2>nul

REM Backups
echo 💾 Movendo backups...
move "lira_backups" "organized\liraos-backups\" 2>nul
move "*backup*" "organized\liraos-backups\" 2>nul

REM Outros projetos
echo 📦 Movendo outros projetos...
move "chroma-mcp-server" "organized\liraos-misc\" 2>nul
move "gamificação" "organized\liraos-misc\" 2>nul
move "config" "organized\liraos-misc\" 2>nul
move "server" "organized\liraos-misc\" 2>nul
move "shared" "organized\liraos-misc\" 2>nul

echo.
echo ✅ Organização concluída!
echo.
echo 📂 Estrutura organizada:
tree organized /F /A
echo.
echo 🎯 Para usar: cd organized\liraos-backend ou organized\liraos-frontend
echo.
pause
