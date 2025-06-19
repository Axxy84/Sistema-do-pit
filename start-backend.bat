@echo off
echo ========================================
echo   INICIANDO SERVIDOR BACKEND PIT STOP
echo ========================================
echo.

cd backend

REM Configurar variáveis de ambiente
set NODE_ENV=development
set PORT=3001
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=pizzaria_db
set DB_USER=postgres
set DB_PASSWORD=sua_senha_aqui
set JWT_SECRET=gere_uma_chave_secreta_forte_aqui
set CORS_ORIGIN=http://localhost:5173

echo [CONFIG] Ambiente: %NODE_ENV%
echo [CONFIG] Porta: %PORT%
echo [CONFIG] Banco: %DB_NAME% em %DB_HOST%:%DB_PORT%
echo.

echo [INFO] Iniciando servidor...
echo.

node server.js 