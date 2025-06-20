@echo off
echo =========================================
echo      SISTEMA PIT - MODO ELECTRON
echo =========================================
echo.

cd /d "%~dp0\.."

echo Verificando dependencias...
if not exist node_modules\electron (
    echo [!] Electron nao instalado!
    echo Execute primeiro: instalar-com-electron.bat
    pause
    exit /b 1
)

echo.
echo [1/3] Compilando frontend...
call npm run build

echo.
echo [2/3] Iniciando backend...
start /B cmd /c "cd backend && node server.js"

echo.
echo [3/3] Aguardando servidor iniciar...
timeout /t 5 /nobreak >nul

echo.
echo Iniciando Sistema PIT Desktop...
npx electron .

:: Quando fechar o Electron, matar o backend
taskkill /F /IM node.exe >nul 2>&1