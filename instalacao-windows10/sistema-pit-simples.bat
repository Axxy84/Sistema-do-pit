@echo off
title Sistema PIT
color 0A

echo =========================================
echo         SISTEMA PIT - PIZZARIA
echo =========================================
echo.
echo [1] Iniciando servidor backend...

cd /d "%~dp0\..\backend"
start /B node server.js

echo [2] Aguardando inicializacao...
timeout /t 5 /nobreak >nul

echo [3] Abrindo sistema no navegador...
start http://localhost:3001

echo.
echo =========================================
echo Sistema iniciado com sucesso!
echo.
echo Acesse: http://localhost:3001
echo Email: admin@pizzaria.com
echo Senha: admin123
echo.
echo Para parar o sistema, feche esta janela.
echo =========================================
echo.

:: Manter janela aberta
pause >nul

:: Ao fechar, matar o processo node
taskkill /F /IM node.exe >nul 2>&1