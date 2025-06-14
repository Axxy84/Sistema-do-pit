@echo off
echo ========================================
echo   INICIANDO SERVIDOR BACKEND PIT STOP
echo ========================================
echo.

cd backend

REM Configurar variáveis de ambiente
set NODE_ENV=development
set PORT=3001
set DB_HOST=192.168.0.105
set DB_PORT=5432
set DB_NAME=sistema_pizzaria
set DB_USER=sistema_pit
set DB_PASSWORD=senha123
set JWT_SECRET=pit_stop_pizzaria_secret_2024_dev_key
set CORS_ORIGIN=*

echo [CONFIG] Ambiente: %NODE_ENV%
echo [CONFIG] Porta: %PORT%
echo [CONFIG] Banco: %DB_NAME% em %DB_HOST%:%DB_PORT%
echo.

echo [INFO] Iniciando servidor...
echo.

node server.js 