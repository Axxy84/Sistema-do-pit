@echo off
chcp 65001 > nul
cls

echo ═══════════════════════════════════════════════════════
echo    🍕 GERADOR DE INSTALADOR - SISTEMA PIZZARIA
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

echo 📦 Instalando dependências de build...
call npm install --save-dev electron electron-builder

echo.
echo 🔨 Compilando frontend...
call npm run build

echo.
echo 📦 Preparando backend...
cd backend
call npm install --production
cd ..

echo.
echo 🎨 Criando ícone...
if not exist "public\icon.ico" (
    echo ⚠️  Ícone não encontrado! Usando ícone padrão...
    REM Criar um ícone básico se não existir
)

echo.
echo 📝 Criando licença...
(
echo Sistema Pizzaria - Licença de Uso
echo.
echo Copyright (c) 2024 Pit Stop
echo.
echo Este software é fornecido "como está", sem garantia de qualquer tipo.
echo.
echo Todos os direitos reservados.
) > LICENSE.txt

echo.
echo 🚀 Gerando instalador EXE...
call npx electron-builder --win

echo.
echo ═══════════════════════════════════════════════════════
echo ✅ INSTALADOR CRIADO COM SUCESSO!
echo ═══════════════════════════════════════════════════════
echo.
echo 📁 Arquivo gerado em:
echo    instaladores\Sistema Pizzaria Setup *.exe
echo.
echo 💡 Este instalador:
echo    • Instala o sistema completo
echo    • Cria atalhos no desktop e menu iniciar
echo    • Configura tudo automaticamente
echo    • Não precisa de Node.js instalado
echo.
pause