@echo off
title Sistema PIT - Instalador Completo
color 0C
cls

echo =========================================
echo   INSTALADOR COMPLETO - SISTEMA PIT
echo =========================================
echo.
echo Este instalador vai:
echo - Corrigir todos os erros
echo - Criar um atalho na area de trabalho
echo - Deixar tudo pronto para usar
echo.
pause

cd /d "%~dp0\.."
set SISTEMA_PATH=%cd%

echo.
echo [1/6] Criando arquivo index.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<link rel="icon" type="image/x-icon" href="/icon.ico"^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo   ^<title^>Sistema PIT^</title^>
echo ^</head^>
echo ^<body^>
echo   ^<div id="root"^>^</div^>
echo   ^<script type="module" src="/src/main.jsx"^>^</script^>
echo ^</body^>
echo ^</html^>
) > index.html

echo [OK] index.html criado

echo.
echo [2/6] Instalando dependencias faltantes do backend...
cd backend
call npm install swagger-jsdoc swagger-ui-express --save
cd ..

echo.
echo [3/6] Compilando o frontend...
call npm run build

echo.
echo [4/6] Criando executavel simplificado...

:: Criar arquivo para iniciar o sistema
echo @echo off > "%SISTEMA_PATH%\Sistema-PIT.bat"
echo title Sistema PIT >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo cd /d "%SISTEMA_PATH%" >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo ========================================= >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo         INICIANDO SISTEMA PIT >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo ========================================= >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo Iniciando servidor... >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo start /B cmd /c "cd backend && node server.js" >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo Aguardando servidor inicializar... >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo timeout /t 5 /nobreak ^>nul >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo Abrindo sistema no navegador... >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo start http://localhost:3001 >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo Sistema rodando! >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo Para parar, feche esta janela. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo Email: admin@pizzaria.com >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo Senha: admin123 >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo echo. >> "%SISTEMA_PATH%\Sistema-PIT.bat"
echo pause ^>nul >> "%SISTEMA_PATH%\Sistema-PIT.bat"

echo.
echo [5/6] Criando atalho na area de trabalho...

:: Criar VBScript para criar atalho
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%USERPROFILE%\Desktop\Sistema PIT.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%SISTEMA_PATH%\Sistema-PIT.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%SISTEMA_PATH%" >> CreateShortcut.vbs
echo oLink.IconLocation = "%SISTEMA_PATH%\public\icon.ico" >> CreateShortcut.vbs
echo oLink.Description = "Sistema de Gestao PIT" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

cscript CreateShortcut.vbs
del CreateShortcut.vbs

echo [OK] Atalho criado na area de trabalho

echo.
echo [6/6] Configurando servidor para servir o frontend...

:: Criar arquivo de configuração para servir arquivos estáticos
cd backend
echo. >> server.js
echo // Servir arquivos estaticos do frontend >> server.js
echo app.use(express.static(path.join(__dirname, '..', 'dist'))); >> server.js
echo. >> server.js
echo // Rota para servir o index.html >> server.js
echo app.get('*', (req, res) =^> { >> server.js
echo   res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')); >> server.js
echo }); >> server.js

cd ..

echo.
echo =========================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo =========================================
echo.
echo COMO USAR:
echo.
echo 1. Clique no icone "Sistema PIT" na area de trabalho
echo.
echo 2. O sistema vai abrir automaticamente no navegador
echo.
echo 3. Use as credenciais:
echo    Email: admin@pizzaria.com
echo    Senha: admin123
echo.
echo =========================================
echo.
pause