@echo off
echo =========================================
echo     INICIANDO SISTEMA PIT
echo =========================================
echo.

cd /d "%~dp0\.."

echo [1/3] Iniciando servidor backend...
start /B cmd /c "cd backend && npm start"

echo [2/3] Aguardando servidor inicializar...
timeout /t 5 /nobreak >nul

echo [3/3] Abrindo sistema no navegador...
start http://localhost:5173

echo.
echo Sistema iniciado com sucesso!
echo.
echo Para parar o sistema, feche esta janela.
echo.

:: Iniciar frontend
npm run preview