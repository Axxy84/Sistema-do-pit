@echo off
echo Parando Sistema PIT...

:: Parar processos Node.js
taskkill /F /IM node.exe >nul 2>&1

echo Sistema parado com sucesso!
pause