@echo off
echo =========================================
echo   INSTALADOR SISTEMA PIT - WINDOWS 10
echo =========================================
echo.

:: Verificar se está sendo executado como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Este instalador precisa ser executado como Administrador!
    echo.
    echo Clique com o botao direito e selecione "Executar como administrador"
    pause
    exit /b 1
)

echo [1/7] Verificando pre-requisitos...
echo.

:: Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js nao encontrado!
    echo.
    echo Baixando e instalando Node.js...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'node-installer.msi'"
    msiexec /i node-installer.msi /quiet /norestart
    del node-installer.msi
    echo Node.js instalado com sucesso!
) else (
    echo [OK] Node.js ja instalado
)

:: Verificar PostgreSQL
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] PostgreSQL nao encontrado!
    echo.
    echo Por favor, instale o PostgreSQL manualmente:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo Apos instalar, execute este instalador novamente.
    pause
    exit /b 1
) else (
    echo [OK] PostgreSQL ja instalado
)

echo.
echo [2/7] Criando estrutura de pastas...
cd /d "%~dp0\.."
set SISTEMA_PATH=%cd%

echo.
echo [3/7] Instalando dependencias do Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do backend!
    pause
    exit /b 1
)

echo.
echo [4/7] Configurando banco de dados...
echo.
echo Digite a senha do usuario postgres do PostgreSQL:
set /p PGPASSWORD=

:: Criar banco de dados
psql -U postgres -c "CREATE DATABASE IF NOT EXISTS pizzaria_db;"
psql -U postgres -c "CREATE USER IF NOT EXISTS pizzaria_user WITH PASSWORD 'pizzaria_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;"

:: Executar migrações
echo.
echo Executando migracoes do banco de dados...
npm run migrate

echo.
echo [5/7] Instalando dependencias do Frontend...
cd ..
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do frontend!
    pause
    exit /b 1
)

echo.
echo [6/7] Compilando Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar o frontend!
    pause
    exit /b 1
)

echo.
echo [7/7] Criando atalhos na area de trabalho...

:: Criar atalho para iniciar o sistema
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Sistema PIT.lnk'); $Shortcut.TargetPath = '%SISTEMA_PATH%\instalacao-windows10\iniciar-sistema.bat'; $Shortcut.WorkingDirectory = '%SISTEMA_PATH%'; $Shortcut.IconLocation = '%SISTEMA_PATH%\public\icon.ico'; $Shortcut.Save()"

:: Criar arquivo para iniciar o sistema
echo @echo off > iniciar-sistema.bat
echo cd /d "%SISTEMA_PATH%" >> iniciar-sistema.bat
echo echo Iniciando Sistema PIT... >> iniciar-sistema.bat
echo start /B cmd /c "cd backend && npm start" >> iniciar-sistema.bat
echo timeout /t 5 /nobreak ^>nul >> iniciar-sistema.bat
echo start http://localhost:5173 >> iniciar-sistema.bat
echo cd /d "%SISTEMA_PATH%" >> iniciar-sistema.bat
echo npm run preview >> iniciar-sistema.bat

echo.
echo =========================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo =========================================
echo.
echo Sistema instalado em: %SISTEMA_PATH%
echo.
echo Para iniciar o sistema:
echo - Use o atalho "Sistema PIT" na area de trabalho
echo - Ou execute: iniciar-sistema.bat
echo.
echo Credenciais de acesso:
echo Email: admin@pizzaria.com
echo Senha: admin123
echo.
pause