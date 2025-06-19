@echo off
chcp 65001 > nul
cls

echo ═══════════════════════════════════════════════════════
echo    🍕 INICIANDO INSTALAÇÃO DO SISTEMA PIZZARIA
echo ═══════════════════════════════════════════════════════
echo.

REM Mudar para a pasta correta do sistema
cd /d "C:\Users\User\Documents\sistema-do-pit\sistema-do-pit"

echo 📁 Mudando para pasta do sistema...
echo    %CD%
echo.

REM Verificar se chegou na pasta correta
if not exist "package.json" (
    echo ❌ ERRO: Não foi possível encontrar a pasta do sistema!
    echo.
    echo Verifique se o sistema está em:
    echo C:\Users\User\Documents\sistema-do-pit\sistema-do-pit
    echo.
    pause
    exit /b 1
)

echo ✅ Pasta do sistema encontrada!
echo.
echo 🚀 Iniciando instalação...
echo.

REM Chamar o instalador principal
call instalacao\instalar-local-automatico.bat

pause