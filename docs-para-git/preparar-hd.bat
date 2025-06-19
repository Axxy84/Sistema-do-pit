@echo off
echo ==========================================
echo PREPARANDO SISTEMA PARA LEVAR NO HD
echo ==========================================
echo.

:: Verificar se Docker esta instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Docker nao instalado localmente
    echo Certifique-se de baixar o instalador!
    echo.
)

:: Menu
echo O que deseja preparar?
echo.
echo 1 - Preparar tudo (recomendado)
echo 2 - Apenas baixar imagens Docker
echo 3 - Criar pacote offline completo
echo 4 - Sair
echo.
set /p opcao=Digite a opcao: 

if "%opcao%"=="1" goto preparar_tudo
if "%opcao%"=="2" goto baixar_imagens
if "%opcao%"=="3" goto pacote_offline
if "%opcao%"=="4" exit

:preparar_tudo
echo.
echo [1/4] Criando pasta de instaladores...
mkdir instaladores 2>nul

echo.
echo [2/4] Baixando imagens Docker...
docker pull postgres:15-alpine
docker pull node:18-alpine
docker pull nginx:alpine
docker pull redis:7-alpine

echo.
echo [3/4] Criando arquivo de instrucoes...
echo INSTRUCOES DE INSTALACAO > LEIA-ME-PRIMEIRO.txt
echo ======================= >> LEIA-ME-PRIMEIRO.txt
echo. >> LEIA-ME-PRIMEIRO.txt
echo 1. Instale o Docker Desktop do arquivo na pasta 'instaladores' >> LEIA-ME-PRIMEIRO.txt
echo 2. Copie toda esta pasta para C:\ >> LEIA-ME-PRIMEIRO.txt
echo 3. Abra o terminal na pasta copiada >> LEIA-ME-PRIMEIRO.txt
echo 4. Execute: deploy-lite.bat (PC fraco) ou deploy.sh (PC normal) >> LEIA-ME-PRIMEIRO.txt
echo 5. Acesse: http://localhost >> LEIA-ME-PRIMEIRO.txt
echo    Login: admin@pizzaria.com >> LEIA-ME-PRIMEIRO.txt
echo    Senha: admin123 >> LEIA-ME-PRIMEIRO.txt
echo. >> LEIA-ME-PRIMEIRO.txt
echo Para PCs com 4GB RAM ou menos, use sempre deploy-lite.bat >> LEIA-ME-PRIMEIRO.txt

echo.
echo [4/4] Verificando arquivos essenciais...
if not exist docker-compose.yml echo [AVISO] docker-compose.yml nao encontrado!
if not exist docker-compose.lite.yml echo [AVISO] docker-compose.lite.yml nao encontrado!
if not exist backend\Dockerfile echo [AVISO] backend\Dockerfile nao encontrado!
if not exist deploy.sh echo [AVISO] deploy.sh nao encontrado!
if not exist deploy-lite.bat echo [AVISO] deploy-lite.bat nao encontrado!

echo.
echo ==========================================
echo PREPARACAO CONCLUIDA!
echo ==========================================
echo.
echo IMPORTANTE - Baixe manualmente:
echo 1. Docker Desktop: https://docker.com
echo 2. Salve o instalador em: instaladores\
echo.
echo Seu HD esta pronto para levar!
echo.
pause
goto fim

:baixar_imagens
echo.
echo Baixando imagens Docker...
docker pull postgres:15-alpine
docker pull node:18-alpine  
docker pull nginx:alpine
docker pull redis:7-alpine
echo.
echo Imagens baixadas com sucesso!
pause
goto fim

:pacote_offline
echo.
echo [OFFLINE] Criando pacote para instalacao sem internet...
echo.

mkdir instalacao-offline 2>nul

echo [1/3] Salvando imagens Docker...
docker save -o instalacao-offline\postgres.tar postgres:15-alpine
docker save -o instalacao-offline\node.tar node:18-alpine
docker save -o instalacao-offline\nginx.tar nginx:alpine
docker save -o instalacao-offline\redis.tar redis:7-alpine

echo.
echo [2/3] Criando script de carga...
echo @echo off > instalacao-offline\carregar-imagens.bat
echo echo Carregando imagens Docker... >> instalacao-offline\carregar-imagens.bat
echo docker load -i postgres.tar >> instalacao-offline\carregar-imagens.bat
echo docker load -i node.tar >> instalacao-offline\carregar-imagens.bat
echo docker load -i nginx.tar >> instalacao-offline\carregar-imagens.bat
echo docker load -i redis.tar >> instalacao-offline\carregar-imagens.bat
echo echo. >> instalacao-offline\carregar-imagens.bat
echo echo Imagens carregadas! >> instalacao-offline\carregar-imagens.bat
echo pause >> instalacao-offline\carregar-imagens.bat

echo.
echo [3/3] Tamanho do pacote:
dir instalacao-offline\*.tar | findstr tar

echo.
echo ==========================================
echo PACOTE OFFLINE CRIADO!
echo ==========================================
echo.
echo No PC de destino:
echo 1. Execute: instalacao-offline\carregar-imagens.bat
echo 2. Depois: deploy-lite.bat
echo.
pause

:fim