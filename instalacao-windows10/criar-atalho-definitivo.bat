@echo off
title Criador de Atalho - Sistema PIT
cls

echo =========================================
echo   CRIANDO ATALHO DEFINITIVO DO SISTEMA
echo =========================================
echo.

cd /d "%~dp0\.."
set SISTEMA_PATH=%cd%

echo Criando arquivo de inicializacao...

:: Criar arquivo Sistema-PIT-Desktop.bat na área de trabalho
(
echo @echo off
echo title Sistema PIT - Pizzaria
echo color 0C
echo cls
echo.
echo echo =========================================
echo echo          SISTEMA PIT - PIZZARIA
echo echo =========================================
echo echo.
echo echo [1/4] Iniciando servidor backend...
echo cd /d "%SISTEMA_PATH%\backend"
echo start "Backend - Sistema PIT" cmd /k node server.js
echo.
echo echo [2/4] Aguardando servidor inicializar...
echo timeout /t 5 /nobreak ^>nul
echo.
echo echo [3/4] Iniciando interface web...
echo cd /d "%SISTEMA_PATH%"
echo start "Frontend - Sistema PIT" cmd /k npm run dev
echo.
echo echo [4/4] Aguardando interface carregar...
echo timeout /t 5 /nobreak ^>nul
echo.
echo echo =========================================
echo echo    SISTEMA INICIADO COM SUCESSO!
echo echo =========================================
echo echo.
echo echo Abrindo no navegador...
echo start http://localhost:5173
echo.
echo echo.
echo echo CREDENCIAIS DE ACESSO:
echo echo ----------------------
echo echo Email: admin@pizzaria.com
echo echo Senha: admin123
echo echo.
echo echo =========================================
echo echo.
echo echo Para parar o sistema:
echo echo 1. Feche esta janela
echo echo 2. Feche as janelas do Backend e Frontend
echo echo.
echo pause
) > "%USERPROFILE%\Desktop\Sistema-PIT.bat"

echo.
echo Criando atalho com icone...

:: Criar VBScript para criar atalho com ícone
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Sistema PIT.lnk"^)
echo oShellLink.TargetPath = "%USERPROFILE%\Desktop\Sistema-PIT.bat"
echo oShellLink.WindowStyle = 1
echo oShellLink.IconLocation = "%SISTEMA_PATH%\public\icon.ico"
echo oShellLink.Description = "Sistema de Gestao para Pizzaria"
echo oShellLink.WorkingDirectory = "%SISTEMA_PATH%"
echo oShellLink.Save
) > "%temp%\CreateShortcut.vbs"

cscript //nologo "%temp%\CreateShortcut.vbs"
del "%temp%\CreateShortcut.vbs"

:: Deletar o arquivo .bat (deixar só o atalho)
timeout /t 2 /nobreak >nul
del "%USERPROFILE%\Desktop\Sistema-PIT.bat"

echo.
echo =========================================
echo   ATALHO CRIADO COM SUCESSO!
echo =========================================
echo.
echo Na area de trabalho voce tem agora:
echo.
echo   [+] Sistema PIT (icone vermelho)
echo.
echo Ao clicar neste atalho:
echo   - Inicia o servidor backend
echo   - Inicia a interface web
echo   - Abre automaticamente no navegador
echo   - Mostra as credenciais de login
echo.
echo =========================================
echo.
pause