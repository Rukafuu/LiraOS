@echo off
title Instalador RVC (Singing Voice) - LiraOS 🎤
echo ==========================================
echo    INSTALADOR RVC (Singing Extension)
echo ==========================================
echo.

cd /d "%~dp0"

if not exist "venv" (
    echo [1/4] Criando ambiente virtual venv...
    python -m venv venv
)

echo [2/4] Ativando venv...
call venv\Scripts\activate

echo [3/4] Instalando dependencias (Isso pode demorar)...
echo    - Instalando PyTorch (CUDA)...
pip install torch==2.1.2+cu118 torchvision==0.16.2+cu118 torchaudio==2.1.2+cu118 --index-url https://download.pytorch.org/whl/cu118

echo    - Instalando dependencias do RVC...
pip install -r requirements.txt

echo.
echo [4/4] Verificando instalacao...
python -c "import torch; print(f'Torch: {torch.__version__}, CUDA: {torch.cuda.is_available()}')"

echo.
echo ==========================================
echo    INSTALACAO CONCLUIDA! 🦊🎶
echo ==========================================
echo.
echo Para iniciar, use o start_lira.bat (configuracao futura) ou rode:
echo cd backend\rvc
echo venv\Scripts\activate
echo python server.py
echo.
pause
