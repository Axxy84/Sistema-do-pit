@echo off
echo ===============================================
echo REINICIANDO SISTEMA E LIMPANDO CACHES
echo ===============================================

echo.
echo [1/5] Parando todos os processos node.exe...
taskkill /F /IM node.exe /T 2>nul
echo Processos node.exe encerrados.

echo.
echo [2/5] Limpando cache do dashboard no backend...
cd backend
node limpar-cache-dashboard.js
echo Cache do backend limpo.

echo.
echo [3/5] Iniciando servidor backend...
start cmd /c "cd backend && npm start"
echo Servidor backend iniciado.

echo.
echo [4/5] Aguardando inicialização do backend (10 segundos)...
timeout /t 10 /nobreak > nul

echo.
echo [5/5] Iniciando servidor frontend...
start cmd /c "npm run dev"
echo Servidor frontend iniciado.

echo.
echo ===============================================
echo SISTEMA REINICIADO COM SUCESSO!
echo ===============================================
echo.
echo Instruções para o navegador:
echo 1. Pressione CTRL+F5 para forçar atualização
echo 2. Ou abra o console (F12) e digite: localStorage.clear(); location.reload();
echo.
echo Pressione qualquer tecla para sair...
pause > nul 