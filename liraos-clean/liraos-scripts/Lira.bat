@echo off
cd /d C:\Users\conta\Documents\Lira

REM Ativa o ambiente xtts_env
call xtts_env\Scripts\activate.bat

REM Roda o main da Lira
python lira_main.py

REM Mantém a janela aberta pra ver logs/erros
pause
