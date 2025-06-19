@echo off
chcp 65001 > nul
cls

echo ═══════════════════════════════════════════════════════
echo    🍕 CRIANDO INSTALADOR SIMPLES - SISTEMA PIZZARIA
echo ═══════════════════════════════════════════════════════
echo.

echo 📁 Criando pasta do instalador...
if exist "INSTALADOR-PIZZARIA" rmdir /S /Q "INSTALADOR-PIZZARIA"
mkdir "INSTALADOR-PIZZARIA"
mkdir "INSTALADOR-PIZZARIA\sistema"

echo.
echo 📋 Copiando arquivos do sistema...

REM Copiar tudo exceto node_modules e arquivos desnecessários
xcopy "*.json" "INSTALADOR-PIZZARIA\sistema\" /Y >nul 2>&1
xcopy "*.js" "INSTALADOR-PIZZARIA\sistema\" /Y >nul 2>&1
xcopy "*.html" "INSTALADOR-PIZZARIA\sistema\" /Y >nul 2>&1
xcopy "*.md" "INSTALADOR-PIZZARIA\sistema\" /Y >nul 2>&1
xcopy "src" "INSTALADOR-PIZZARIA\sistema\src\" /E /I /Y >nul 2>&1
xcopy "public" "INSTALADOR-PIZZARIA\sistema\public\" /E /I /Y >nul 2>&1
xcopy "backend" "INSTALADOR-PIZZARIA\sistema\backend\" /E /I /Y >nul 2>&1
xcopy "instalacao" "INSTALADOR-PIZZARIA\sistema\instalacao\" /E /I /Y >nul 2>&1

echo ✅ Arquivos copiados

echo.
echo 🔨 Criando instalador principal...

REM Criar o instalador principal
(
echo @echo off
echo chcp 65001 ^> nul
echo cls
echo.
echo ═══════════════════════════════════════════════════════
echo    🍕 INSTALADOR - SISTEMA PIZZARIA PIT STOP
echo ═══════════════════════════════════════════════════════
echo.
echo.
echo Este instalador irá:
echo   ✓ Verificar requisitos
echo   ✓ Instalar dependências
echo   ✓ Configurar o sistema
echo   ✓ Criar atalhos
echo.
echo Pressione qualquer tecla para continuar...
echo pause ^>nul
echo.
echo.
echo 🔍 Verificando Node.js...
echo node --version ^>nul 2^>^&1
echo if %%errorLevel%% neq 0 ^(
echo     echo ❌ Node.js não encontrado!
echo     echo.
echo     echo 📥 Por favor, instale o Node.js primeiro:
echo     echo.
echo     echo 1. Acesse: https://nodejs.org
echo     echo 2. Baixe a versão LTS
echo     echo 3. Instale e execute este instalador novamente
echo     echo.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo ✅ Node.js encontrado!
echo.
echo.
echo 📁 Instalando sistema em C:\SistemaPizzaria...
echo.
echo if exist "C:\SistemaPizzaria" ^(
echo     echo ⚠️  Pasta já existe. Deseja substituir? ^(S/N^)
echo     set /p resp=Resposta: 
echo     if /i "%%resp%%"=="N" exit /b 0
echo     rmdir /S /Q "C:\SistemaPizzaria"
echo ^)
echo.
echo mkdir "C:\SistemaPizzaria"
echo xcopy "sistema\*.*" "C:\SistemaPizzaria\" /E /I /Y /Q
echo.
echo ✅ Arquivos copiados!
echo.
echo.
echo 📦 Instalando dependências do backend...
echo cd /d "C:\SistemaPizzaria\backend"
echo call npm install --silent
echo.
echo ✅ Backend instalado!
echo.
echo.
echo 📦 Instalando dependências do frontend...
echo cd /d "C:\SistemaPizzaria"
echo call npm install --silent
echo.
echo ✅ Frontend instalado!
echo.
echo.
echo ⚙️  Configurando sistema...
echo cd /d "C:\SistemaPizzaria\backend"
echo ^(
echo echo # Configuração LOCAL
echo echo DB_HOST=localhost
echo echo DB_PORT=5432
echo echo DB_NAME=pizzaria_db
echo echo DB_USER=postgres
echo echo DB_PASSWORD=postgres
echo echo JWT_SECRET=PIT_SECRET_%%RANDOM%%%%RANDOM%%
echo echo JWT_EXPIRES_IN=7d
echo echo PORT=3001
echo echo NODE_ENV=production
echo echo CORS_ORIGIN=http://localhost:5173
echo ^) ^> .env
echo.
echo ✅ Sistema configurado!
echo.
echo.
echo 🖥️  Criando atalhos...
echo.
echo ^(
echo echo @echo off
echo echo title Sistema Pizzaria
echo echo cd /d "C:\SistemaPizzaria"
echo echo start "Backend" /min cmd /c "cd backend ^&^& npm start"
echo echo timeout /t 5 ^>nul
echo echo start "Frontend" /min cmd /c "npm run dev"
echo echo timeout /t 5 ^>nul
echo echo start http://localhost:5173
echo echo echo.
echo echo echo ═══════════════════════════════════════════════
echo echo echo  Sistema rodando! Feche para parar.
echo echo echo ═══════════════════════════════════════════════
echo echo pause
echo echo taskkill /F /IM node.exe 2^>nul
echo ^) ^> "C:\SistemaPizzaria\Iniciar Sistema.bat"
echo.
echo.
echo REM Criar atalho no desktop
echo powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%%USERPROFILE%%\Desktop\Sistema Pizzaria.lnk'^); $Shortcut.TargetPath = 'C:\SistemaPizzaria\Iniciar Sistema.bat'; $Shortcut.WorkingDirectory = 'C:\SistemaPizzaria'; $Shortcut.IconLocation = 'C:\SistemaPizzaria\public\icon.ico'; $Shortcut.Save^(^)"
echo.
echo ✅ Atalhos criados!
echo.
echo.
echo ═══════════════════════════════════════════════════════
echo    ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ═══════════════════════════════════════════════════════
echo.
echo 📁 Sistema instalado em: C:\SistemaPizzaria
echo 🖥️  Atalho criado no Desktop
echo.
echo 🔐 Credenciais de acesso:
echo    Email: admin@pizzaria.com
echo    Senha: admin123
echo.
echo.
echo Deseja iniciar o sistema agora? ^(S/N^)
echo set /p iniciar=Resposta: 
echo if /i "%%iniciar%%"=="S" ^(
echo     start "" "C:\SistemaPizzaria\Iniciar Sistema.bat"
echo ^)
echo.
echo pause
) > "INSTALADOR-PIZZARIA\INSTALAR-SISTEMA.bat"

echo ✅ Instalador criado!

echo.
echo 🗜️ Compactando instalador...
powershell -Command "Compress-Archive -Path 'INSTALADOR-PIZZARIA\*' -DestinationPath 'SistemaPizzaria-Instalador.zip' -Force"

echo.
echo ═══════════════════════════════════════════════════════
echo    ✅ INSTALADOR CRIADO COM SUCESSO!
echo ═══════════════════════════════════════════════════════
echo.
echo 📁 Arquivos criados:
echo.
echo    1. INSTALADOR-PIZZARIA\  (pasta com instalador)
echo    2. SistemaPizzaria-Instalador.zip  (arquivo zipado)
echo.
echo 💡 Como usar:
echo.
echo    1. Envie o arquivo ZIP para o cliente
echo    2. Cliente extrai o ZIP
echo    3. Cliente executa INSTALAR-SISTEMA.bat
echo    4. Sistema é instalado automaticamente
echo.
echo 📋 O instalador irá:
echo    • Verificar se Node.js está instalado
echo    • Copiar sistema para C:\SistemaPizzaria
echo    • Instalar todas as dependências
echo    • Criar atalhos no desktop
echo    • Configurar tudo automaticamente
echo.
pause