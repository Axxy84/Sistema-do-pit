@echo off
chcp 65001 > nul
cls
echo.
echo ═══════════════════════════════════════════════════════
echo    🍕 INSTALAÇÃO MANUAL SIMPLIFICADA
echo ═══════════════════════════════════════════════════════
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js não está instalado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo 📦 Instalando dependências do backend...
cd backend
call npm install
if %errorLevel% neq 0 (
    echo ❌ Erro ao instalar backend
    pause
    exit /b 1
)

echo.
echo 📦 Instalando dependências do frontend...
cd ..
call npm install
if %errorLevel% neq 0 (
    echo ❌ Erro ao instalar frontend
    pause
    exit /b 1
)

echo.
echo ⚙️  Criando arquivo de configuração...
cd backend
(
echo # Configuração LOCAL
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=pizzaria_db
echo DB_USER=postgres
echo DB_PASSWORD=postgres
echo JWT_SECRET=PIT_SECRET_123456
echo JWT_EXPIRES_IN=7d
echo PORT=3001
echo NODE_ENV=development
echo CORS_ORIGIN=http://localhost:5173
) > .env

cd ..

echo.
echo ✅ INSTALAÇÃO CONCLUÍDA!
echo.
echo 🚀 Para iniciar o sistema:
echo.
echo 1. Abra 2 janelas do Prompt de Comando
echo.
echo 2. Na primeira janela:
echo    cd backend
echo    npm start
echo.
echo 3. Na segunda janela:
echo    npm run dev
echo.
echo 4. Acesse: http://localhost:5173
echo.
echo 🔐 Login padrão:
echo    Email: admin@pizzaria.com
echo    Senha: admin123
echo.
pause