@echo off
chcp 65001 > nul
cls
echo.
echo ═══════════════════════════════════════════════════════
echo    🔍 DIAGNÓSTICO DE INSTALAÇÃO - SISTEMA PIZZARIA
echo ═══════════════════════════════════════════════════════
echo.

REM Manter janela aberta no final
setlocal enabledelayedexpansion

echo 📁 Verificando diretório atual...
echo    Pasta: %CD%
echo.

REM Verificar se está na pasta correta
if not exist "package.json" (
    echo ❌ ERRO: Arquivo package.json não encontrado!
    echo    Você está na pasta errada.
    echo.
    echo 💡 SOLUÇÃO:
    echo    1. Navegue até a pasta "Sistema-do-pit"
    echo    2. Execute este arquivo novamente
    echo.
    pause
    exit /b 1
)

REM Verificar se está executando como administrador
echo 🔐 Verificando privilégios de administrador...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERRO: Sem privilégios de administrador!
    echo.
    echo 💡 SOLUÇÃO:
    echo    1. Feche esta janela
    echo    2. Clique com botão direito no arquivo
    echo    3. Selecione "Executar como Administrador"
    echo.
    pause
    exit /b 1
)
echo ✅ Privilégios de administrador OK
echo.

REM Verificar Node.js
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js não está instalado!
    echo.
    echo 💡 SOLUÇÃO:
    echo    1. Baixe Node.js em: https://nodejs.org
    echo    2. Instale a versão LTS
    echo    3. Execute este diagnóstico novamente
    echo.
) else (
    echo ✅ Node.js instalado: 
    node --version
)
echo.

REM Verificar NPM
echo 🔍 Verificando NPM...
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ NPM não está funcionando!
    echo.
) else (
    echo ✅ NPM instalado: 
    npm --version
)
echo.

REM Verificar estrutura de pastas
echo 📂 Verificando estrutura de pastas...
if exist "backend" (
    echo ✅ Pasta backend encontrada
) else (
    echo ❌ Pasta backend não encontrada!
)

if exist "src" (
    echo ✅ Pasta src encontrada
) else (
    echo ❌ Pasta src não encontrada!
)

if exist "instalacao" (
    echo ✅ Pasta instalacao encontrada
) else (
    echo ❌ Pasta instalacao não encontrada!
)
echo.

REM Verificar PostgreSQL
echo 🔍 Verificando PostgreSQL...
where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  PostgreSQL não está instalado (opcional)
    echo    O sistema pode usar SQLite como alternativa
) else (
    echo ✅ PostgreSQL encontrado
    psql --version
)
echo.

REM Verificar portas
echo 🔍 Verificando portas...
netstat -an | find ":3001" >nul 2>&1
if %errorLevel% equ 0 (
    echo ⚠️  Porta 3001 já está em uso!
    echo    Isso pode causar conflitos
) else (
    echo ✅ Porta 3001 livre
)

netstat -an | find ":5173" >nul 2>&1
if %errorLevel% equ 0 (
    echo ⚠️  Porta 5173 já está em uso!
    echo    Isso pode causar conflitos
) else (
    echo ✅ Porta 5173 livre
)
echo.

echo ═══════════════════════════════════════════════════════
echo 📋 RESUMO DO DIAGNÓSTICO
echo ═══════════════════════════════════════════════════════
echo.
echo Se todos os itens estão ✅, você pode executar:
echo    instalacao\instalar-local-automatico.bat
echo.
echo Se há itens ❌, corrija-os primeiro!
echo.
echo 💡 INSTALAÇÃO MANUAL ALTERNATIVA:
echo.
echo 1. Abra 2 prompts de comando como Administrador
echo.
echo 2. No primeiro prompt:
echo    cd backend
echo    npm install
echo    npm start
echo.
echo 3. No segundo prompt:
echo    npm install
echo    npm run dev
echo.
echo 4. Acesse: http://localhost:5173
echo.
pause