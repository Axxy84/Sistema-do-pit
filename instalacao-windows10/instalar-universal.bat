@echo off
chcp 65001 > nul
title Sistema PIT - Instalação Universal
cls

:: Cores para output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo.
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo %BLUE%    🍕 SISTEMA PIT - INSTALAÇÃO UNIVERSAL%RESET%
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo.

:: Verificar privilégios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%❌ ERRO: Execute como Administrador!%RESET%
    echo.
    echo %YELLOW%💡 SOLUÇÃO:%RESET%
    echo    1. Clique com botão direito no arquivo
    echo    2. Selecione "Executar como Administrador"
    echo.
    pause
    exit /b 1
)

echo %GREEN%✅ Privilégios de administrador OK%RESET%
echo.

:: Navegar para pasta correta
cd /d "%~dp0\.."
if not exist "package.json" (
    echo %RED%❌ ERRO: Arquivo package.json não encontrado!%RESET%
    echo %YELLOW%💡 Execute este arquivo na pasta Sistema-do-pit%RESET%
    pause
    exit /b 1
)

set SISTEMA_PATH=%cd%
echo %BLUE%📁 Sistema encontrado em: %SISTEMA_PATH%%RESET%
echo.

:: Verificar e instalar Node.js
echo %BLUE%[1/6] Verificando Node.js...%RESET%
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %YELLOW%⚠️  Node.js não encontrado. Instalando...%RESET%
    echo.
    echo Baixando Node.js LTS...
    curl -L "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -o node-installer.msi
    if %errorLevel% neq 0 (
        echo %RED%❌ Erro ao baixar Node.js!%RESET%
        echo %YELLOW%💡 Baixe manualmente em: https://nodejs.org%RESET%
        pause
        exit /b 1
    )
    
    echo Instalando Node.js...
    msiexec /i node-installer.msi /quiet /norestart
    del node-installer.msi
    
    :: Recarregar PATH
    call refreshenv 2>nul
    
    :: Verificar instalação
    node --version >nul 2>&1
    if %errorLevel% neq 0 (
        echo %RED%❌ Falha na instalação do Node.js!%RESET%
        echo %YELLOW%💡 Reinicie o computador e tente novamente%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%✅ Node.js instalado com sucesso%RESET%
) else (
    echo %GREEN%✅ Node.js já instalado: %RESET%
    node --version
)
echo.

:: Configurar ambiente
echo %BLUE%[2/6] Configurando ambiente...%RESET%

:: Criar arquivo .env do backend se não existir
if not exist "backend\.env" (
    if exist "backend\production.env" (
        echo Criando configuração do backend...
        copy backend\production.env backend\.env >nul
    ) else (
        echo Criando configuração padrão...
        echo NODE_ENV=production > backend\.env
        echo PORT=3001 >> backend\.env
        echo CORS_ORIGIN=http://localhost:5173 >> backend\.env
        echo JWT_SECRET=sistema_pit_jwt_secret_2024 >> backend\.env
        echo ENABLE_LOGGING=true >> backend\.env
    )
)

:: Verificar banco de dados
echo %BLUE%[3/6] Configurando banco de dados...%RESET%
psql --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %YELLOW%⚠️  PostgreSQL não encontrado. Usando SQLite...%RESET%
    echo DB_TYPE=sqlite >> backend\.env
    echo DB_PATH=./data/pizzaria.db >> backend\.env
    
    :: Criar pasta data se não existir
    if not exist "backend\data" mkdir backend\data
) else (
    echo %GREEN%✅ PostgreSQL encontrado%RESET%
    echo.
    echo %YELLOW%Configurar PostgreSQL?%RESET%
    echo [1] Sim - Configurar PostgreSQL
    echo [2] Não - Usar SQLite (mais simples)
    echo.
    set /p escolha=Digite sua escolha (1 ou 2): 
    
    if "%escolha%"=="1" (
        echo.
        set /p pgpass=Digite a senha do postgres: 
        
        :: Testar conexão
        set PGPASSWORD=!pgpass!
        psql -U postgres -c "SELECT version();" >nul 2>&1
        if !errorLevel! neq 0 (
            echo %RED%❌ Erro de conexão! Usando SQLite...%RESET%
            echo DB_TYPE=sqlite >> backend\.env
            echo DB_PATH=./data/pizzaria.db >> backend\.env
            if not exist "backend\data" mkdir backend\data
        ) else (
            echo %GREEN%✅ Conexão PostgreSQL OK%RESET%
            echo DB_HOST=localhost >> backend\.env
            echo DB_PORT=5432 >> backend\.env
            echo DB_NAME=pizzaria_db >> backend\.env
            echo DB_USER=postgres >> backend\.env
            echo DB_PASSWORD=!pgpass! >> backend\.env
            
            :: Criar base de dados
            psql -U postgres -c "CREATE DATABASE pizzaria_db;" 2>nul
        )
    ) else (
        echo %GREEN%✅ Configurado para SQLite%RESET%
        echo DB_TYPE=sqlite >> backend\.env
        echo DB_PATH=./data/pizzaria.db >> backend\.env
        if not exist "backend\data" mkdir backend\data
    )
)
echo.

:: Verificar portas livres
echo %BLUE%[4/6] Verificando portas...%RESET%
netstat -an | find ":3001" >nul 2>&1
if %errorLevel% equ 0 (
    echo %YELLOW%⚠️  Porta 3001 em uso. Tentando parar processo...%RESET%
    taskkill /f /im node.exe 2>nul
    timeout /t 2 /nobreak >nul
)

netstat -an | find ":5173" >nul 2>&1
if %errorLevel% equ 0 (
    echo %YELLOW%⚠️  Porta 5173 em uso. Tentando parar processo...%RESET%
    taskkill /f /im node.exe 2>nul
    timeout /t 2 /nobreak >nul
)
echo %GREEN%✅ Portas verificadas%RESET%
echo.

:: Instalar dependências
echo %BLUE%[5/6] Instalando dependências...%RESET%
echo.
echo Instalando dependências do backend...
cd backend
call npm install --production
if %errorLevel% neq 0 (
    echo %RED%❌ Erro ao instalar dependências do backend!%RESET%
    echo %YELLOW%💡 Tentando com configuração alternativa...%RESET%
    call npm install --production --no-optional
    if %errorLevel% neq 0 (
        echo %RED%❌ Falha crítica na instalação!%RESET%
        pause
        exit /b 1
    )
)
echo %GREEN%✅ Backend instalado%RESET%

cd ..
echo.
echo Instalando dependências do frontend...
call npm install --production
if %errorLevel% neq 0 (
    echo %RED%❌ Erro ao instalar dependências do frontend!%RESET%
    echo %YELLOW%💡 Tentando com configuração alternativa...%RESET%
    call npm install --production --no-optional
    if %errorLevel% neq 0 (
        echo %RED%❌ Falha crítica na instalação!%RESET%
        pause
        exit /b 1
    )
)
echo %GREEN%✅ Frontend instalado%RESET%
echo.

:: Criar scripts de controle
echo %BLUE%[6/6] Criando scripts de controle...%RESET%

:: Script para iniciar
echo @echo off > "🍕 Iniciar Sistema.bat"
echo chcp 65001 ^> nul >> "🍕 Iniciar Sistema.bat"
echo title Sistema PIT - Iniciando... >> "🍕 Iniciar Sistema.bat"
echo cd /d "%SISTEMA_PATH%" >> "🍕 Iniciar Sistema.bat"
echo echo Iniciando servidor... >> "🍕 Iniciar Sistema.bat"
echo start "Backend PIT" cmd /k "cd backend ^&^& npm start" >> "🍕 Iniciar Sistema.bat"
echo timeout /t 5 /nobreak ^>nul >> "🍕 Iniciar Sistema.bat"
echo echo Iniciando interface... >> "🍕 Iniciar Sistema.bat"
echo start "Frontend PIT" cmd /k "npm run dev" >> "🍕 Iniciar Sistema.bat"
echo timeout /t 5 /nobreak ^>nul >> "🍕 Iniciar Sistema.bat"
echo echo Sistema iniciado! Abrindo navegador... >> "🍕 Iniciar Sistema.bat"
echo start http://localhost:5173 >> "🍕 Iniciar Sistema.bat"

:: Script para parar
echo @echo off > "🛑 Parar Sistema.bat"
echo echo Parando Sistema PIT... >> "🛑 Parar Sistema.bat"
echo taskkill /f /im node.exe 2^>nul >> "🛑 Parar Sistema.bat"
echo echo Sistema parado! >> "🛑 Parar Sistema.bat"
echo pause >> "🛑 Parar Sistema.bat"

:: Script para acessar
echo @echo off > "🌐 Acessar Sistema.bat"
echo start http://localhost:5173 >> "🌐 Acessar Sistema.bat"

:: Script de status
echo @echo off > "📊 Status Sistema.bat"
echo echo Verificando status do Sistema PIT... >> "📊 Status Sistema.bat"
echo netstat -an ^| find ":3001" ^>nul 2^>^&1 >> "📊 Status Sistema.bat"
echo if %%errorLevel%% equ 0 ^( >> "📊 Status Sistema.bat"
echo     echo ✅ Backend rodando na porta 3001 >> "📊 Status Sistema.bat"
echo ^) else ^( >> "📊 Status Sistema.bat"
echo     echo ❌ Backend não está rodando >> "📊 Status Sistema.bat"
echo ^) >> "📊 Status Sistema.bat"
echo netstat -an ^| find ":5173" ^>nul 2^>^&1 >> "📊 Status Sistema.bat"
echo if %%errorLevel%% equ 0 ^( >> "📊 Status Sistema.bat"
echo     echo ✅ Frontend rodando na porta 5173 >> "📊 Status Sistema.bat"
echo ^) else ^( >> "📊 Status Sistema.bat"
echo     echo ❌ Frontend não está rodando >> "📊 Status Sistema.bat"
echo ^) >> "📊 Status Sistema.bat"
echo pause >> "📊 Status Sistema.bat"

:: Criar atalhos na área de trabalho
echo Criando atalhos...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\🍕 Sistema PIT.lnk'); $Shortcut.TargetPath = '%SISTEMA_PATH%\🍕 Iniciar Sistema.bat'; $Shortcut.WorkingDirectory = '%SISTEMA_PATH%'; $Shortcut.IconLocation = '%SISTEMA_PATH%\public\icon.ico'; $Shortcut.Save()" 2>nul

echo %GREEN%✅ Scripts criados%RESET%
echo.

:: Executar migrações se necessário
if exist "backend\scripts\migrate.js" (
    echo Executando migrações iniciais...
    cd backend
    node scripts/migrate.js
    cd ..
    echo %GREEN%✅ Migrações executadas%RESET%
)

echo.
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo %GREEN%    🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!%RESET%
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo.
echo %GREEN%Sistema instalado em: %SISTEMA_PATH%%RESET%
echo.
echo %YELLOW%📱 Para iniciar o sistema:%RESET%
echo   • Duplo clique: "🍕 Iniciar Sistema.bat"
echo   • Ou use o atalho na área de trabalho
echo.
echo %YELLOW%🌐 Acesso ao sistema:%RESET%
echo   • URL: http://localhost:5173
echo   • Usuário: admin@pizzaria.com
echo   • Senha: admin123
echo.
echo %YELLOW%🛠️ Controles disponíveis:%RESET%
echo   • 🍕 Iniciar Sistema.bat
echo   • 🛑 Parar Sistema.bat
echo   • 🌐 Acessar Sistema.bat
echo   • 📊 Status Sistema.bat
echo.
echo %BLUE%💡 DICA: Sistema funciona 100% local!%RESET%
echo %BLUE%   Não precisa de internet após instalado%RESET%
echo.
pause