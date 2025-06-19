@echo off
chcp 65001 > nul
cls

echo ═══════════════════════════════════════════════════════
echo    🍕 GERADOR EXECUTÁVEL PORTÁTIL - SISTEMA PIZZARIA
echo ═══════════════════════════════════════════════════════
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js não está instalado!
    echo    Instale em: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo 📦 Instalando pkg (empacotador Node.js)...
call npm install -g pkg

echo.
echo 🔨 Compilando frontend...
call npm run build

echo.
echo 📦 Criando executável do backend...
cd backend

REM Criar arquivo de entrada para pkg
(
echo const path = require('path');
echo process.env.NODE_ENV = 'production';
echo process.env.PKG_EXECPATH = 'PKG_INVOKE_NODEJS';
echo require('./server.js');
) > pkg-entry.js

echo.
echo 🚀 Empacotando backend em EXE...
call pkg pkg-entry.js --targets node18-win-x64 --output sistema-pizzaria-backend.exe

cd ..

echo.
echo 📁 Criando estrutura portátil...
if not exist "sistema-pizzaria-portable" mkdir "sistema-pizzaria-portable"
if not exist "sistema-pizzaria-portable\backend" mkdir "sistema-pizzaria-portable\backend"
if not exist "sistema-pizzaria-portable\frontend" mkdir "sistema-pizzaria-portable\frontend"

echo.
echo 📋 Copiando arquivos...
REM Copiar executável do backend
copy "backend\sistema-pizzaria-backend.exe" "sistema-pizzaria-portable\backend\" >nul

REM Copiar frontend compilado
xcopy "dist" "sistema-pizzaria-portable\frontend" /E /I /Y >nul

REM Copiar node_modules essenciais do backend
xcopy "backend\node_modules" "sistema-pizzaria-portable\backend\node_modules" /E /I /Y >nul

REM Criar arquivo .env padrão
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
echo NODE_ENV=production
echo CORS_ORIGIN=http://localhost:5173
) > "sistema-pizzaria-portable\backend\.env"

REM Criar script de inicialização
(
echo @echo off
echo title Sistema Pizzaria - Portátil
echo cls
echo.
echo ═══════════════════════════════════════════════════════
echo    🍕 SISTEMA PIZZARIA - VERSÃO PORTÁTIL
echo ═══════════════════════════════════════════════════════
echo.
echo ⚡ Iniciando backend...
echo start /B backend\sistema-pizzaria-backend.exe
echo.
echo ⚡ Aguardando inicialização...
echo timeout /t 3 >nul
echo.
echo ⚡ Iniciando servidor web...
echo cd frontend
echo npx http-server -p 5173 -c-1 --proxy http://localhost:5173?
echo.
echo 🌐 Sistema disponível em: http://localhost:5173
echo.
echo 📋 Login padrão:
echo    Email: admin@pizzaria.com
echo    Senha: admin123
echo.
echo Pressione CTRL+C para parar o sistema
echo.
echo pause >nul
) > "sistema-pizzaria-portable\iniciar.bat"

REM Criar README
(
echo # Sistema Pizzaria - Versão Portátil
echo.
echo ## Como usar:
echo.
echo 1. Execute 'iniciar.bat'
echo 2. Acesse http://localhost:5173
echo 3. Login: admin@pizzaria.com / admin123
echo.
echo ## Requisitos:
echo.
echo - Windows 10 ou superior
echo - PostgreSQL instalado
echo.
echo ## Estrutura:
echo.
echo - backend/ - Servidor API
echo - frontend/ - Interface web
echo - iniciar.bat - Script de inicialização
) > "sistema-pizzaria-portable\README.md"

echo.
echo 🗜️ Compactando em ZIP...
powershell -Command "Compress-Archive -Path 'sistema-pizzaria-portable' -DestinationPath 'SistemaPizzaria-Portable.zip' -Force"

echo.
echo ═══════════════════════════════════════════════════════
echo ✅ EXECUTÁVEL PORTÁTIL CRIADO!
echo ═══════════════════════════════════════════════════════
echo.
echo 📁 Arquivos gerados:
echo    • sistema-pizzaria-portable\ (pasta)
echo    • SistemaPizzaria-Portable.zip
echo.
echo 💡 Para usar:
echo    1. Extraia o ZIP
echo    2. Execute 'iniciar.bat'
echo    3. Acesse http://localhost:5173
echo.
echo ⚠️  IMPORTANTE:
echo    • Requer PostgreSQL instalado
echo    • Funciona totalmente offline
echo    • Pode ser copiado para pendrive
echo.
pause