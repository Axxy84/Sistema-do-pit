@echo off
title Sistema PIT - Pizzaria
color 0C
cls

echo ===============================================
echo           SISTEMA PIT - PIZZARIA
echo ===============================================
echo.
echo [1/4] Iniciando servidor backend...

:: Iniciar backend
cd /d "%~dp0backend"
start "Backend - Sistema PIT" cmd /c "node server.js || pause"

:: Aguardar backend iniciar
echo Aguardando servidor inicializar...
timeout /t 5 /nobreak >nul

echo.
echo [2/4] Iniciando interface web...

:: Voltar para pasta raiz
cd /d "%~dp0"

:: Iniciar frontend
start "Frontend - Sistema PIT" cmd /c "npm run dev || pause"

:: Aguardar frontend iniciar
echo Aguardando interface carregar...
timeout /t 8 /nobreak >nul

echo.
echo [3/4] Abrindo sistema no navegador...
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