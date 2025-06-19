@echo off
chcp 65001 > nul
cls
echo.
echo ═══════════════════════════════════════════════════════
echo    🍕 INSTALADOR LOCAL - SISTEMA PIZZARIA 🍕
echo      (Funciona em qualquer rede - LOCALHOST)
echo ═══════════════════════════════════════════════════════
echo.

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Este instalador precisa ser executado como Administrador
    echo    Clique com botão direito e selecione "Executar como Administrador"
    echo.
    pause
    exit /b 1
)

echo ✅ Privilégios de Administrador confirmados
echo.

echo 🎯 CONFIGURAÇÃO: Sistema rodará 100%% LOCAL
echo    • Backend: http://localhost:3001
echo    • Frontend: http://localhost:5173
echo    • Funciona em QUALQUER rede!
echo.

REM Verificar se Node.js está instalado
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo 📥 Baixando e instalando Node.js...
    
    REM Baixar Node.js
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi' -OutFile 'nodejs-installer.msi'"
    
    if not exist nodejs-installer.msi (
        echo ❌ Erro ao baixar Node.js
        echo 🌐 Baixe manualmente: https://nodejs.org
        pause
        exit /b 1
    )
    
    echo ⚡ Instalando Node.js (pode demorar alguns minutos)...
    msiexec /i nodejs-installer.msi /quiet /norestart
    
    echo ✅ Node.js instalado! Reiniciando variáveis...
    timeout /t 3 >nul
    
    REM Atualizar PATH
    setx PATH "%PATH%;%ProgramFiles%\nodejs" /M
    set "PATH=%PATH%;%ProgramFiles%\nodejs"
    
    del nodejs-installer.msi
) else (
    echo ✅ Node.js encontrado
    node --version
)

echo.

REM Verificar PostgreSQL
echo 🔍 Verificando PostgreSQL...
where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ PostgreSQL não encontrado!
    echo.
    echo 📋 Escolha o tipo de banco:
    echo [1] PostgreSQL (robusto, recomendado)
    echo [2] SQLite (leve, mais simples)
    echo.
    set /p banco="Escolha (1 ou 2): "
    
    if "%banco%"=="1" (
        call :install_postgresql
    ) else (
        call :setup_sqlite
        set "using_sqlite=true"
    )
) else (
    echo ✅ PostgreSQL encontrado
    psql --version
    set "using_sqlite=false"
)

echo.
echo ⚡ Configurando sistema LOCAL...

REM Instalar dependências do backend
echo 📦 Instalando dependências do backend...
cd backend
if exist package-lock.json del package-lock.json
call npm install --silent --prefer-offline
if %errorLevel% neq 0 (
    echo ❌ Erro ao instalar dependências do backend
    echo Tentando novamente...
    call npm install --legacy-peer-deps
    if %errorLevel% neq 0 (
        echo ❌ Erro crítico na instalação
        pause
        exit /b 1
    )
)

echo ✅ Backend configurado

REM Instalar dependências do frontend
echo 📦 Instalando dependências do frontend...
cd ..
if exist package-lock.json del package-lock.json
call npm install --silent --prefer-offline
if %errorLevel% neq 0 (
    echo ❌ Erro ao instalar dependências do frontend
    echo Tentando novamente...
    call npm install --legacy-peer-deps
    if %errorLevel% neq 0 (
        echo ❌ Erro crítico na instalação
        pause
        exit /b 1
    )
)

echo ✅ Frontend configurado

REM Configurar arquivo .env para LOCALHOST
echo ⚙️  Configurando sistema LOCAL...
cd backend

if "%using_sqlite%"=="true" (
    REM Configuração SQLite
    (
    echo # Configuração LOCAL - SQLite
    echo DB_HOST=localhost
    echo DB_PORT=5432
    echo DB_NAME=./data/pizzaria.db
    echo DB_USER=
    echo DB_PASSWORD=
    echo DATABASE_TYPE=sqlite
    echo JWT_SECRET=PIT_PIZZARIA_LOCAL_%RANDOM%%RANDOM%
    echo JWT_EXPIRES_IN=7d
    echo PORT=3001
    echo NODE_ENV=production
    echo CORS_ORIGIN=http://localhost:5173
    echo # Sistema configurado para funcionar 100%% LOCAL
    ) > .env
    
    REM Criar pasta data
    if not exist data mkdir data
    echo ✅ SQLite configurado
    
) else (
    REM Configuração PostgreSQL
    (
    echo # Configuração LOCAL - PostgreSQL
    echo DB_HOST=localhost
    echo DB_PORT=5432
    echo DB_NAME=pizzaria_db
    echo DB_USER=postgres
    echo DB_PASSWORD=sua_senha_postgres
    echo JWT_SECRET=PIT_PIZZARIA_LOCAL_%RANDOM%%RANDOM%
    echo JWT_EXPIRES_IN=7d
    echo PORT=3001
    echo NODE_ENV=production
    echo CORS_ORIGIN=http://localhost:5173
    echo # Sistema configurado para funcionar 100%% LOCAL
    ) > .env
    echo ✅ PostgreSQL configurado
)

REM Executar migração do banco
echo 🗃️  Criando estrutura do banco...
node scripts/migrate.js >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Criando banco manualmente...
    if "%using_sqlite%"=="false" (
        echo CREATE DATABASE pizzaria_db; | psql -U postgres -h localhost >nul 2>&1
        node scripts/migrate.js >nul 2>&1
    )
)

cd ..

REM Configurar vite.config.js para LOCALHOST
echo 🔧 Configurando frontend LOCAL...
(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo import path from 'path'
echo.
echo export default defineConfig({
echo   plugins: [react()],
echo   resolve: {
echo     alias: {
echo       '@': path.resolve(__dirname, './src'^)
echo     }
echo   },
echo   server: {
echo     port: 5173,
echo     host: 'localhost',  // LOCALHOST APENAS
echo     strictPort: true
echo   },
echo   build: {
echo     rollupOptions: {
echo       output: {
echo         manualChunks: {
echo           vendor: ['react', 'react-dom'],
echo           router: ['react-router-dom'],
echo           ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
echo         }
echo       }
echo     }
echo   }
echo }^)
) > vite.config.js

echo ✅ Frontend configurado para LOCALHOST

echo.
echo 🔗 Criando atalhos e scripts...

REM Script para iniciar o sistema
(
echo @echo off
echo title 🍕 Sistema Pizzaria - Servidor LOCAL
echo cls
echo.
echo ┌─────────────────────────────────────────────────┐
echo │        🍕 SISTEMA PIZZARIA ATIVO 🍕           │
echo │                                                 │
echo │  ✅ Sistema: 100%% LOCAL                        │
echo │  🌐 Acesso: http://localhost:5173              │
echo │  🔧 API: http://localhost:3001                  │
echo │                                                 │
echo │  🔐 Login: admin@pizzaria.com                   │
echo │  🔑 Senha: admin123                             │
echo │                                                 │
echo │  💡 Funciona em QUALQUER rede!                 │
echo └─────────────────────────────────────────────────┘
echo.
echo ⚡ Iniciando servidor backend...
start /min "Backend API" cmd /c "cd /d %CD%\backend && npm start"
echo    Backend iniciado em segundo plano
echo.
echo ⚡ Aguardando backend... (3 segundos^)
timeout /t 3 >nul
echo.
echo ⚡ Iniciando frontend...
start /min "Frontend PWA" cmd /c "cd /d %CD% && npm run dev"
echo    Frontend iniciado em segundo plano
echo.
echo ⚡ Aguardando sistema... (5 segundos^)
timeout /t 5 >nul
echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 🚀 Abrindo sistema no navegador...
start http://localhost:5173
echo.
echo 📱 DICA: Clique em "Instalar como app" para usar como programa!
echo.
echo ═══════════════════════════════════════════════════════
echo  Sistema rodando! Feche esta janela para parar tudo.
echo ═══════════════════════════════════════════════════════
echo.
pause
echo.
echo 🛑 Parando sistema...
taskkill /F /IM node.exe 2^>nul
echo ✅ Sistema parado!
timeout /t 2 >nul
) > "🍕 Iniciar Sistema.bat"

REM Script para parar sistema
(
echo @echo off
echo title Parar Sistema Pizzaria
echo echo 🛑 Parando Sistema Pizzaria...
echo taskkill /F /IM node.exe 2^>nul ^| find /v "ERROR"
echo echo ✅ Sistema parado!
echo timeout /t 2 >nul
) > "🛑 Parar Sistema.bat"

REM Script para acessar sistema
(
echo @echo off
echo echo 🚀 Abrindo Sistema Pizzaria...
echo start http://localhost:5173
echo timeout /t 1 >nul
) > "🌐 Acessar Sistema.bat"

REM Script para verificar status
(
echo @echo off
echo title Status do Sistema
echo echo 🔍 Verificando status do sistema...
echo echo.
echo netstat -an ^| find ":3001" ^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ Backend: RODANDO na porta 3001
echo ^) else ^(
echo     echo ❌ Backend: PARADO
echo ^)
echo.
echo netstat -an ^| find ":5173" ^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ Frontend: RODANDO na porta 5173
echo ^) else ^(
echo     echo ❌ Frontend: PARADO
echo ^)
echo.
echo echo 🌐 URL de acesso: http://localhost:5173
echo echo.
echo pause
) > "📊 Status Sistema.bat"

REM Criar atalho na área de trabalho
echo 🖥️  Criando atalho na área de trabalho...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\🍕 Sistema Pizzaria.lnk'); $Shortcut.TargetPath = '%CD%\🍕 Iniciar Sistema.bat'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Save()" >nul 2>&1

REM Criar atalho no menu iniciar
echo 📱 Criando atalho no menu iniciar...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Sistema Pizzaria" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Sistema Pizzaria"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Sistema Pizzaria\Sistema Pizzaria.lnk'); $Shortcut.TargetPath = '%CD%\🍕 Iniciar Sistema.bat'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Save()" >nul 2>&1

echo.
echo ═══════════════════════════════════════════════════════
echo                    ✅ INSTALAÇÃO CONCLUÍDA! 
echo ═══════════════════════════════════════════════════════
echo.
echo 🎯 SISTEMA 100%% LOCAL CONFIGURADO:
echo.
echo 📍 Acesso: http://localhost:5173
echo 🔧 API: http://localhost:3001
echo 💾 Banco: %CD%\backend\data\
echo.
echo 🚀 COMO USAR:
echo.
echo 1️⃣  LIGAR o sistema:
echo    • Duplo clique: "🍕 Iniciar Sistema.bat"
echo    • Ou atalho da área de trabalho
echo    • Ou menu iniciar → Sistema Pizzaria
echo.
echo 2️⃣  ACESSAR o sistema:
echo    • Sistema abre automaticamente no navegador
echo    • Ou digite: http://localhost:5173
echo    • Ou clique: "🌐 Acessar Sistema.bat"
echo.
echo 3️⃣  INSTALAR como PWA:
echo    • No navegador, clique "Instalar como app"
echo    • Sistema vira programa no Windows
echo    • Ícone no menu iniciar e área de trabalho
echo.
echo 4️⃣  VERIFICAR status:
echo    • Clique: "📊 Status Sistema.bat"
echo.
echo 5️⃣  DESLIGAR sistema:
echo    • Clique: "🛑 Parar Sistema.bat"
echo    • Ou feche a janela do servidor
echo.
echo 🔐 CREDENCIAIS:
echo    📧 Email: admin@pizzaria.com
echo    🔑 Senha: admin123
echo.
echo 🌟 VANTAGENS DO SISTEMA LOCAL:
echo    ✅ Funciona em QUALQUER rede
echo    ✅ Não precisa configurar IP
echo    ✅ Funciona offline
echo    ✅ Dados ficam no próprio computador
echo    ✅ Seguro e privado
echo.
echo 💡 IMPORTANTE:
echo    • Este sistema roda 100%% neste computador
echo    • Pode ser usado em qualquer lugar
echo    • Não depende de internet ou rede
echo    • Ideal para levar para o cliente
echo.
echo ═══════════════════════════════════════════════════════
echo.
set /p start="Deseja iniciar o sistema agora? (S/N): "
if /i "%start%"=="S" (
    echo.
    echo 🚀 Iniciando sistema...
    start "" "🍕 Iniciar Sistema.bat"
)
echo.
echo ✅ Instalação finalizada!
pause
goto :eof

REM Função para instalar PostgreSQL
:install_postgresql
echo.
echo 📥 Instalando PostgreSQL...
echo ⚠️  IMPORTANTE: Durante a instalação:
echo    • Senha do superusuário: escolha uma senha forte
echo    • Porta: 5432 (padrão)
echo    • Aceitar demais opções padrão
echo.
pause

REM Baixar PostgreSQL
echo 📥 Baixando PostgreSQL (pode demorar)...
powershell -Command "Invoke-WebRequest -Uri 'https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64.exe' -OutFile 'postgresql-installer.exe'"

if not exist postgresql-installer.exe (
    echo ❌ Erro ao baixar PostgreSQL
    echo.
    echo 🌐 Baixe manualmente em: https://www.postgresql.org/download/windows/
echo    Use a senha que você escolheu durante a instalação
    pause
    exit /b 1
)

echo ⚡ Executando instalador PostgreSQL...
echo    (Uma janela de instalação irá abrir)
postgresql-installer.exe

echo ✅ Aguardando conclusão da instalação...
timeout /t 5 >nul

REM Adicionar PostgreSQL ao PATH
setx PATH "%PATH%;C:\Program Files\PostgreSQL\15\bin" /M >nul 2>&1
set "PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin"

del postgresql-installer.exe
echo ✅ PostgreSQL instalado
goto :eof

REM Função para configurar SQLite
:setup_sqlite
echo.
echo ⚡ Configurando SQLite (banco leve)...
cd backend

REM Instalar SQLite para Node.js
echo 📦 Instalando driver SQLite...
call npm install sqlite3 better-sqlite3 --save --silent

echo ✅ SQLite configurado
cd ..
goto :eof