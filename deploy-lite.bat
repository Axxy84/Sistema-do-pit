@echo off
echo ========================================
echo SISTEMA PIZZARIA - VERSAO LITE
echo Para Windows 10 com 4GB RAM
echo ========================================
echo.

:: Verificar se Docker esta instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao esta instalado!
    echo.
    echo Por favor instale o Docker Desktop:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    echo IMPORTANTE: No Docker Desktop, va em:
    echo Settings - Resources - Advanced
    echo Configure: Memory: 2GB, CPUs: 2
    echo.
    pause
    exit /b 1
)

:: Menu de opcoes
:menu
echo O que deseja fazer?
echo.
echo 1 - Instalar sistema (primeira vez)
echo 2 - Iniciar sistema
echo 3 - Parar sistema
echo 4 - Ver logs
echo 5 - Fazer backup
echo 6 - Limpar e reinstalar
echo 7 - Sair
echo.
set /p opcao=Digite a opcao: 

if "%opcao%"=="1" goto instalar
if "%opcao%"=="2" goto iniciar
if "%opcao%"=="3" goto parar
if "%opcao%"=="4" goto logs
if "%opcao%"=="5" goto backup
if "%opcao%"=="6" goto limpar
if "%opcao%"=="7" goto fim

echo Opcao invalida!
pause
cls
goto menu

:instalar
echo.
echo [INSTALANDO] Preparando ambiente...
echo.

:: Criar arquivo .env se nao existir
if not exist .env (
    copy .env.production .env >nul 2>&1
    echo [INFO] Arquivo .env criado. IMPORTANTE: Edite as senhas!
    echo.
)

:: Parar containers antigos se existirem
docker-compose -f docker-compose.lite.yml down >nul 2>&1

echo [INSTALANDO] Construindo imagens (pode demorar 10-20 minutos)...
docker-compose -f docker-compose.lite.yml build --no-cache

echo.
echo [INSTALANDO] Iniciando servicos...
docker-compose -f docker-compose.lite.yml up -d

echo.
echo [AGUARDANDO] Aguardando banco de dados iniciar (30 segundos)...
timeout /t 30 /nobreak >nul

echo.
echo [INSTALANDO] Executando migracoes do banco...
docker-compose -f docker-compose.lite.yml exec backend npm run migrate

echo.
echo ========================================
echo INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Sistema disponivel em:
echo - Frontend: http://localhost
echo - Backend: http://localhost:3001
echo.
echo Login padrao:
echo - Email: admin@pizzaria.com
echo - Senha: admin123
echo.
echo IMPORTANTE: Mude a senha do admin!
echo ========================================
echo.
pause
cls
goto menu

:iniciar
echo.
echo [INICIANDO] Iniciando servicos...
docker-compose -f docker-compose.lite.yml up -d
echo.
echo Sistema iniciado!
echo Frontend: http://localhost
echo.
pause
cls
goto menu

:parar
echo.
echo [PARANDO] Parando servicos...
docker-compose -f docker-compose.lite.yml down
echo.
echo Sistema parado!
echo.
pause
cls
goto menu

:logs
echo.
echo [LOGS] Mostrando logs (Ctrl+C para sair)...
echo.
docker-compose -f docker-compose.lite.yml logs -f --tail=50
pause
cls
goto menu

:backup
echo.
echo [BACKUP] Criando backup do banco de dados...
echo.

:: Criar pasta de backup se nao existir
if not exist backups mkdir backups

:: Gerar nome do arquivo com data/hora
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set backup_file=backups\backup_%datetime:~0,8%_%datetime:~8,6%.sql

:: Executar backup
docker-compose -f docker-compose.lite.yml exec -T postgres pg_dump -U postgres pizzaria_db > %backup_file%

echo Backup salvo em: %backup_file%
echo.
pause
cls
goto menu

:limpar
echo.
echo [AVISO] Isso vai APAGAR TODOS OS DADOS!
echo.
set /p confirma=Tem certeza? (S/N): 
if /i "%confirma%" neq "S" goto menu

echo.
echo [LIMPANDO] Removendo containers e volumes...
docker-compose -f docker-compose.lite.yml down -v
echo.
echo [LIMPANDO] Removendo imagens...
docker rmi $(docker images -q pizzaria-* 2>nul) >nul 2>&1
echo.
echo Sistema limpo! Execute opcao 1 para reinstalar.
echo.
pause
cls
goto menu

:fim
exit