@echo off
chcp 65001 > nul
title Sistema PIT - Teste de Instalação
cls

:: Cores para output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo.
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo %BLUE%    🧪 TESTE AUTOMÁTICO DE INSTALAÇÃO%RESET%
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo.

cd /d "%~dp0\.."
set SISTEMA_PATH=%cd%

echo %BLUE%📁 Testando em: %SISTEMA_PATH%%RESET%
echo.

:: Teste 1: Estrutura de arquivos
echo %BLUE%[1/8] Verificando estrutura de arquivos...%RESET%
set ARQUIVOS_OK=0

if exist "package.json" (
    echo %GREEN%✅ package.json%RESET%
    set /a ARQUIVOS_OK+=1
) else (
    echo %RED%❌ package.json%RESET%
)

if exist "backend\package.json" (
    echo %GREEN%✅ backend\package.json%RESET%
    set /a ARQUIVOS_OK+=1
) else (
    echo %RED%❌ backend\package.json%RESET%
)

if exist "backend\.env" (
    echo %GREEN%✅ backend\.env%RESET%
    set /a ARQUIVOS_OK+=1
) else (
    echo %YELLOW%⚠️  backend\.env (será criado)%RESET%
)

if exist "src\main.jsx" (
    echo %GREEN%✅ src\main.jsx%RESET%
    set /a ARQUIVOS_OK+=1
) else (
    echo %RED%❌ src\main.jsx%RESET%
)

if %ARQUIVOS_OK% geq 3 (
    echo %GREEN%✅ Estrutura de arquivos OK%RESET%
) else (
    echo %RED%❌ Estrutura de arquivos incompleta%RESET%
)
echo.

:: Teste 2: Node.js
echo %BLUE%[2/8] Verificando Node.js...%RESET%
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo %GREEN%✅ Node.js instalado: %RESET%
    node --version
) else (
    echo %RED%❌ Node.js não encontrado%RESET%
)

npm --version >nul 2>&1
if %errorLevel% equ 0 (
    echo %GREEN%✅ NPM instalado: %RESET%
    npm --version
) else (
    echo %RED%❌ NPM não encontrado%RESET%
)
echo.

:: Teste 3: Dependências do Backend
echo %BLUE%[3/8] Verificando dependências do backend...%RESET%
if exist "backend\node_modules" (
    echo %GREEN%✅ Backend node_modules existe%RESET%
    
    :: Verificar algumas dependências críticas
    if exist "backend\node_modules\express" (
        echo %GREEN%✅ Express instalado%RESET%
    ) else (
        echo %RED%❌ Express não encontrado%RESET%
    )
    
    if exist "backend\node_modules\pg" (
        echo %GREEN%✅ PostgreSQL driver instalado%RESET%
    ) else (
        echo %YELLOW%⚠️  PostgreSQL driver não encontrado%RESET%
    )
) else (
    echo %RED%❌ Backend node_modules não existe%RESET%
    echo %YELLOW%💡 Execute: cd backend && npm install%RESET%
)
echo.

:: Teste 4: Dependências do Frontend
echo %BLUE%[4/8] Verificando dependências do frontend...%RESET%
if exist "node_modules" (
    echo %GREEN%✅ Frontend node_modules existe%RESET%
    
    if exist "node_modules\react" (
        echo %GREEN%✅ React instalado%RESET%
    ) else (
        echo %RED%❌ React não encontrado%RESET%
    )
    
    if exist "node_modules\vite" (
        echo %GREEN%✅ Vite instalado%RESET%
    ) else (
        echo %RED%❌ Vite não encontrado%RESET%
    )
) else (
    echo %RED%❌ Frontend node_modules não existe%RESET%
    echo %YELLOW%💡 Execute: npm install%RESET%
)
echo.

:: Teste 5: Configuração de Banco
echo %BLUE%[5/8] Verificando configuração de banco...%RESET%
if exist "backend\.env" (
    findstr /i "DB_" backend\.env >nul
    if %errorLevel% equ 0 (
        echo %GREEN%✅ Configuração de banco encontrada%RESET%
    ) else (
        echo %YELLOW%⚠️  Configuração de banco não encontrada%RESET%
    )
) else (
    echo %YELLOW%⚠️  Arquivo .env não existe%RESET%
)

:: Verificar PostgreSQL
psql --version >nul 2>&1
if %errorLevel% equ 0 (
    echo %GREEN%✅ PostgreSQL disponível%RESET%
) else (
    echo %YELLOW%⚠️  PostgreSQL não encontrado (SQLite será usado)%RESET%
)
echo.

:: Teste 6: Portas
echo %BLUE%[6/8] Verificando portas...%RESET%
netstat -an | find ":3001" >nul 2>&1
if %errorLevel% equ 0 (
    echo %YELLOW%⚠️  Porta 3001 em uso%RESET%
) else (
    echo %GREEN%✅ Porta 3001 livre%RESET%
)

netstat -an | find ":5173" >nul 2>&1
if %errorLevel% equ 0 (
    echo %YELLOW%⚠️  Porta 5173 em uso%RESET%
) else (
    echo %GREEN%✅ Porta 5173 livre%RESET%
)
echo.

:: Teste 7: Scripts de controle
echo %BLUE%[7/8] Verificando scripts de controle...%RESET%
if exist "🍕 Iniciar Sistema.bat" (
    echo %GREEN%✅ Script de inicialização%RESET%
) else (
    echo %YELLOW%⚠️  Script de inicialização não encontrado%RESET%
)

if exist "🛑 Parar Sistema.bat" (
    echo %GREEN%✅ Script de parada%RESET%
) else (
    echo %YELLOW%⚠️  Script de parada não encontrado%RESET%
)

if exist "🌐 Acessar Sistema.bat" (
    echo %GREEN%✅ Script de acesso%RESET%
) else (
    echo %YELLOW%⚠️  Script de acesso não encontrado%RESET%
)
echo.

:: Teste 8: Teste de sintaxe
echo %BLUE%[8/8] Teste de sintaxe do backend...%RESET%
cd backend
node -c server.js >nul 2>&1
if %errorLevel% equ 0 (
    echo %GREEN%✅ Sintaxe do server.js OK%RESET%
) else (
    echo %RED%❌ Erro de sintaxe no server.js%RESET%
)
cd ..
echo.

:: Resumo
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo %BLUE%    📋 RESUMO DO TESTE%RESET%
echo %BLUE%═══════════════════════════════════════════════════════%RESET%
echo.

:: Calcular pontuação
set PONTOS=0

if %ARQUIVOS_OK% geq 3 set /a PONTOS+=1
node --version >nul 2>&1 && set /a PONTOS+=1
if exist "backend\node_modules" set /a PONTOS+=1
if exist "node_modules" set /a PONTOS+=1
if exist "backend\.env" set /a PONTOS+=1

if %PONTOS% geq 4 (
    echo %GREEN%🎉 SISTEMA PRONTO PARA USO! (%PONTOS%/5 pontos)%RESET%
    echo.
    echo %YELLOW%Para iniciar:%RESET%
    echo   🍕 Iniciar Sistema.bat
    echo.
    echo %YELLOW%Para acessar:%RESET%
    echo   http://localhost:5173
    echo   admin@pizzaria.com / admin123
) else (
    echo %RED%⚠️  SISTEMA PRECISA DE CONFIGURAÇÃO (%PONTOS%/5 pontos)%RESET%
    echo.
    echo %YELLOW%Soluções:%RESET%
    if %PONTOS% lss 2 (
        echo   1. Execute: instalar-universal.bat
    ) else (
        echo   1. Instale dependências: npm install
        echo   2. Configure backend: cd backend && npm install
    )
)

echo.
echo %BLUE%💡 DICA: Use instalar-universal.bat para instalação automática%RESET%
echo.
pause