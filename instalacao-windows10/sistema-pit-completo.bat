@echo off
title Sistema PIT - Controle Total
color 0A
cls

echo =========================================
echo      SISTEMA PIT - MENU PRINCIPAL
echo =========================================
echo.
echo   [1] Iniciar Sistema Completo
echo   [2] Iniciar Apenas Backend
echo   [3] Iniciar Apenas Frontend
echo   [4] Parar Sistema
echo   [5] Status do Sistema
echo   [6] Criar Atalho na Area de Trabalho
echo   [7] Sair
echo.
echo =========================================
echo.
set /p opcao="Escolha uma opcao (1-7): "

if "%opcao%"=="1" goto INICIAR_COMPLETO
if "%opcao%"=="2" goto INICIAR_BACKEND
if "%opcao%"=="3" goto INICIAR_FRONTEND
if "%opcao%"=="4" goto PARAR_SISTEMA
if "%opcao%"=="5" goto STATUS_SISTEMA
if "%opcao%"=="6" goto CRIAR_ATALHO
if "%opcao%"=="7" exit

goto MENU

:INICIAR_COMPLETO
cls
echo =========================================
echo    INICIANDO SISTEMA COMPLETO
echo =========================================
echo.
echo [1/3] Iniciando Backend...
cd /d "%~dp0\..\backend"
start "Backend - Sistema PIT" cmd /k node server.js
timeout /t 3 /nobreak >nul

echo [2/3] Iniciando Frontend...
cd /d "%~dp0\.."
start "Frontend - Sistema PIT" cmd /k npm run dev
timeout /t 5 /nobreak >nul

echo [3/3] Abrindo navegador...
start http://localhost:5173
echo.
echo Sistema iniciado com sucesso!
pause
goto MENU

:INICIAR_BACKEND
cls
echo Iniciando apenas o Backend...
cd /d "%~dp0\..\backend"
start "Backend - Sistema PIT" cmd /k node server.js
echo Backend iniciado na porta 3001
pause
goto MENU

:INICIAR_FRONTEND
cls
echo Iniciando apenas o Frontend...
cd /d "%~dp0\.."
start "Frontend - Sistema PIT" cmd /k npm run dev
echo Frontend iniciado na porta 5173
pause
goto MENU

:PARAR_SISTEMA
cls
echo Parando todos os processos...
taskkill /F /FI "WindowTitle eq Backend - Sistema PIT*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Frontend - Sistema PIT*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo Sistema parado!
pause
goto MENU

:STATUS_SISTEMA
cls
echo =========================================
echo       STATUS DO SISTEMA
echo =========================================
echo.
echo Verificando Backend (porta 3001)...
netstat -an | findstr :3001 >nul
if %errorlevel%==0 (
    echo [OK] Backend rodando
) else (
    echo [X] Backend parado
)
echo.
echo Verificando Frontend (porta 5173)...
netstat -an | findstr :5173 >nul
if %errorlevel%==0 (
    echo [OK] Frontend rodando
) else (
    echo [X] Frontend parado
)
echo.
pause
goto MENU

:CRIAR_ATALHO
cls
call "%~dp0criar-atalho-definitivo.bat"
goto MENU