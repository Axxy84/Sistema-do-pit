@echo off
title Sistema PIT - Pizzaria
color 0C
cls

echo ===============================================
echo           SISTEMA PIT - PIZZARIA
echo ===============================================
echo.
echo [1/4] Verificando pastas...

:: Definir o caminho base (CORRIGIDO)
set "BASE_PATH=C:\Users\User\Documents\sistema-do-pit"

:: Verificar se a pasta existe
if not exist "%BASE_PATH%" (
    echo ERRO: Pasta do sistema nao encontrada!
    echo Verifique se o caminho esta correto:
    echo %BASE_PATH%
    pause
    exit /b 1
)

cd /d "%BASE_PATH%"

echo [OK] Pasta encontrada
echo.
echo [2/4] Iniciando servidor backend...

:: Iniciar backend
cd backend
start "Backend - Sistema PIT" cmd /c "node server.js || pause"
cd ..

:: Aguardar backend iniciar
echo Aguardando servidor inicializar...
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Iniciando interface web...

:: Iniciar frontend
start "Frontend - Sistema PIT" cmd /c "npm run dev || pause"

:: Aguardar frontend iniciar
echo Aguardando interface carregar...
timeout /t 8 /nobreak >nul

echo.
echo [4/4] Abrindo sistema no navegador...
start http://localhost:5173

echo.
echo ===============================================
echo         SISTEMA INICIADO COM SUCESSO!
echo ===============================================
echo.
echo CREDENCIAIS DE ACESSO:
echo ----------------------
echo Email: admin@pizzaria.com
echo Senha: admin123
echo.
echo ===============================================
echo.
echo O sistema esta rodando em:
echo - Backend:  http://localhost:3001
echo - Frontend: http://localhost:5173
echo.
echo Para parar o sistema:
echo 1. Feche esta janela
echo 2. Feche as janelas do Backend e Frontend
echo.
echo ===============================================
echo.
pause