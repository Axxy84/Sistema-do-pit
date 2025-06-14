@echo off
echo Executando limpeza do dashboard no PostgreSQL via WSL...

REM Copiar o script shell para o WSL
wsl cp "%~dp0limpar-dashboard-wsl.sh" /tmp/limpar-dashboard-wsl.sh

REM Dar permissão de execução ao script
wsl chmod +x /tmp/limpar-dashboard-wsl.sh

REM Executar o script no WSL
wsl bash /tmp/limpar-dashboard-wsl.sh

REM Remover o script do WSL
wsl rm /tmp/limpar-dashboard-wsl.sh

echo.
echo Processo concluído! Verifique os resultados acima.
echo Lembre-se de reiniciar o servidor backend para limpar o cache em memória.
pause 