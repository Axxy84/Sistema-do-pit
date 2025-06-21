@echo off
chcp 65001 > nul
title Sistema PIT - Correção de Banco de Dados
cls

:: Cores para output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo.
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo %BLUE%    🔧 CORREÇÃO DE BANCO DE DADOS - SISTEMA PIT%RESET%
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo.

cd /d "%~dp0\.."

echo %BLUE%📁 Corrigindo em: %CD%%RESET%
echo.

echo %BLUE%[1/4] Configurando para SQLite...%RESET%

:: Backup do .env atual
if exist "backend\.env" (
    copy backend\.env backend\.env.backup >nul
    echo %GREEN%✅ Backup do .env criado%RESET%
)

:: Criar configuração SQLite
echo # Configuração LOCAL - SQLite (Simples) > backend\.env
echo DB_TYPE=sqlite >> backend\.env
echo DB_PATH=./data/pizzaria.db >> backend\.env
echo. >> backend\.env
echo # Configuração alternativa PostgreSQL (descomente se quiser usar) >> backend\.env
echo # DB_HOST=localhost >> backend\.env
echo # DB_PORT=5432 >> backend\.env
echo # DB_NAME=pizzaria_db >> backend\.env
echo # DB_USER=postgres >> backend\.env
echo # DB_PASSWORD=sua_senha_aqui >> backend\.env
echo. >> backend\.env
echo JWT_SECRET=PIT_SECRET_123456 >> backend\.env
echo JWT_EXPIRES_IN=7d >> backend\.env
echo PORT=3001 >> backend\.env
echo NODE_ENV=development >> backend\.env
echo CORS_ORIGIN=http://localhost:5173 >> backend\.env
echo ENABLE_LOGGING=true >> backend\.env

echo %GREEN%✅ Configuração SQLite criada%RESET%
echo.

echo %BLUE%[2/4] Instalando dependência SQLite...%RESET%
cd backend
call npm install sqlite3
echo %GREEN%✅ SQLite3 instalado%RESET%
cd ..
echo.

echo %BLUE%[3/4] Criando pasta de dados...%RESET%
if not exist "backend\data" mkdir backend\data
echo %GREEN%✅ Pasta data criada%RESET%
echo.

echo %BLUE%[4/4] Executando migrações SQLite...%RESET%
cd backend
if exist "scripts\migrate-universal.js" (
    node scripts/migrate-universal.js
) else (
    echo %YELLOW%⚠️  migrate-universal.js não encontrado, usando migrate.js original%RESET%
    node scripts/migrate.js
)
cd ..
echo.

echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo %GREEN%    🎉 CORREÇÃO CONCLUÍDA!%RESET%
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo.
echo %GREEN%Sistema agora está configurado para SQLite%RESET%
echo %YELLOW%Arquivo de dados: backend\data\pizzaria.db%RESET%
echo.
echo %BLUE%Para iniciar o sistema:%RESET%
echo   🍕 Iniciar Sistema.bat
echo.
echo %BLUE%Para acessar:%RESET%
echo   http://localhost:5173
echo   admin@pizzaria.com / admin123
echo.
pause