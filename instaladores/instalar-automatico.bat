@echo off
chcp 65001 > nul
cls
echo.
echo ═══════════════════════════════════════════════════════
echo    🍕 INSTALADOR AUTOMÁTICO - SISTEMA PIZZARIA 🍕
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

REM Sistema configurado para localhost
echo 🌐 Sistema configurado para localhost (acesso local apenas)
echo.

REM Verificar se Node.js está instalado
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo 📥 Baixando Node.js...
    
    REM Baixar Node.js
    curl -L -o nodejs-installer.msi https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi
    if %errorLevel% neq 0 (
        echo ❌ Erro ao baixar Node.js
        echo 🌐 Baixe manualmente: https://nodejs.org
        pause
        exit /b 1
    )
    
    echo ⚡ Instalando Node.js...
    msiexec /i nodejs-installer.msi /quiet /norestart
    
    echo ✅ Node.js instalado! Reiniciando terminal...
    timeout /t 3 >nul
    
    REM Atualizar PATH
    set "PATH=%PATH%;%ProgramFiles%\nodejs"
    
    del nodejs-installer.msi
) else (
    echo ✅ Node.js encontrado
)

REM Verificar PostgreSQL
echo 🔍 Verificando PostgreSQL...
pg_ctl --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ PostgreSQL não encontrado!
    echo.
    echo 📥 Opções de instalação:
    echo [1] Instalar PostgreSQL automaticamente (recomendado)
    echo [2] Usar SQLite (mais leve)
    echo [3] Cancelar instalação
    echo.
    set /p escolha="Escolha uma opção (1-3): "
    
    if "%escolha%"=="1" (
        call :install_postgresql
    ) else if "%escolha%"=="2" (
        call :setup_sqlite
    ) else (
        echo 🚫 Instalação cancelada
        pause
        exit /b 1
    )
) else (
    echo ✅ PostgreSQL encontrado
)

echo.
echo ⚡ Configurando sistema...

REM Instalar dependências do backend
echo 📦 Instalando dependências do backend...
cd backend
call npm install --silent
if %errorLevel% neq 0 (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)

REM Instalar dependências do frontend
echo 📦 Instalando dependências do frontend...
cd ..
call npm install --silent
if %errorLevel% neq 0 (
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)

REM Configurar arquivo .env automaticamente
echo ⚙️  Configurando banco de dados...
cd backend

REM Criar arquivo .env com IP detectado
(
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=pizzaria_db
echo DB_USER=postgres
echo DB_PASSWORD=8477
echo JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%
echo JWT_EXPIRES_IN=7d
echo PORT=3001
echo NODE_ENV=production
echo CORS_ORIGIN=http://localhost:5173
) > .env

echo ✅ Configuração criada automaticamente

REM Executar migração do banco
echo 🗃️  Criando estrutura do banco...
node scripts/migrate.js
if %errorLevel% neq 0 (
    echo ⚠️  Aviso: Erro na migração do banco (pode ser normal se já existir)
)

cd ..

REM Vite já está configurado para localhost
echo ✅ Sistema configurado para acesso local (localhost)
echo.

REM Criar atalhos
echo 🔗 Criando atalhos...

REM Atalho para iniciar sistema
(
echo @echo off
echo title Sistema Pizzaria - Servidor
echo echo ┌─────────────────────────────────────┐
echo echo │     🍕 SISTEMA PIZZARIA ATIVO 🍕     │
echo echo │                                     │
echo echo │  Frontend: http://localhost:5173     │
echo echo │  Backend:  http://localhost:3001     │
echo echo │                                     │
echo echo │  Login: admin@pizzaria.com          │
echo echo │  Senha: admin123                    │
echo echo └─────────────────────────────────────┘
echo echo.
echo echo ⚡ Iniciando servidor backend...
echo start "Backend" cmd /k "cd /d %CD%\backend && npm start"
echo timeout /t 3
echo echo ⚡ Iniciando frontend...
echo start "Frontend" cmd /k "cd /d %CD% && npm run dev"
echo echo.
echo echo ✅ Sistema iniciado com sucesso!
echo echo 🌐 Acesse: http://localhost:5173
echo echo.
echo echo Pressione qualquer tecla para fechar este terminal
echo pause >nul
) > "Iniciar Sistema.bat"

REM Atalho para parar sistema
(
echo @echo off
echo title Parar Sistema Pizzaria
echo echo 🛑 Parando Sistema Pizzaria...
echo taskkill /F /IM node.exe 2^>nul
echo echo ✅ Sistema parado!
echo timeout /t 2
) > "Parar Sistema.bat"

REM Atalho para acessar sistema
(
echo @echo off
echo start http://localhost:5173
) > "Acessar Sistema.bat"

REM Criar atalho na área de trabalho
echo 🖥️  Criando atalho na área de trabalho...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Sistema Pizzaria.lnk'); $Shortcut.TargetPath = '%CD%\Iniciar Sistema.bat'; $Shortcut.IconLocation = '%CD%\icon.ico,0'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Save()"

echo.
echo ═══════════════════════════════════════════════════════
echo                    ✅ INSTALAÇÃO CONCLUÍDA! 
echo ═══════════════════════════════════════════════════════
echo.
echo 🎯 COMO USAR:
echo.
echo 1️⃣  Para LIGAR o sistema:
echo    • Duplo clique em "Iniciar Sistema.bat"
echo    • Ou use o atalho na área de trabalho
echo.
echo 2️⃣  Para ACESSAR o sistema:
echo    • Abra o navegador
echo    • Digite: http://%ip%:5173
echo    • Ou clique em "Acessar Sistema.bat"
echo.
echo 3️⃣  Para INSTALAR como app:
echo    • Acesse o sistema no navegador
echo    • Clique no banner "Instalar como app"
echo    • Sistema vira um programa no menu iniciar
echo.
echo 4️⃣  Para DESLIGAR o sistema:
echo    • Duplo clique em "Parar Sistema.bat"
echo.
echo 🔐 CREDENCIAIS DE ACESSO:
echo    Email: admin@pizzaria.com
echo    Senha: admin123
echo.
echo 🌐 REDE CONFIGURADA:
echo    IP Local: %ip%
echo    Frontend: http://%ip%:5173
echo    Backend:  http://%ip%:3001
echo.
echo 💡 DICA: Se mudar de rede, execute este instalador novamente!
echo.
echo ═══════════════════════════════════════════════════════
pause
goto :eof

REM Função para instalar PostgreSQL
:install_postgresql
echo 📥 Baixando PostgreSQL...
curl -L -o postgresql-installer.exe "https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64.exe"
if %errorLevel% neq 0 (
    echo ❌ Erro ao baixar PostgreSQL
    echo 🌐 Baixe manualmente: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ⚡ Instalando PostgreSQL...
echo ⚠️  IMPORTANTE: Use a senha "8477" quando solicitado
postgresql-installer.exe --mode unattended --unattendedmodeui minimal --superpassword "8477" --servicename "postgresql" --servicepassword "8477"

del postgresql-installer.exe
echo ✅ PostgreSQL instalado
goto :eof

REM Função para configurar SQLite
:setup_sqlite
echo ⚡ Configurando SQLite...
cd backend
npm install sqlite3 --silent
(
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=./pizzaria.db
echo DB_USER=
echo DB_PASSWORD=
echo JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%
echo JWT_EXPIRES_IN=7d
echo PORT=3001
echo NODE_ENV=production
echo CORS_ORIGIN=http://localhost:5173
echo DATABASE_TYPE=sqlite
) > .env
echo ✅ SQLite configurado
cd ..
goto :eof