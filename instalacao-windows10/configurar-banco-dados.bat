@echo off
echo =========================================
echo   CONFIGURADOR DE BANCO DE DADOS
echo =========================================
echo.

echo Este script ira configurar o PostgreSQL para o Sistema PIT.
echo.

set /p PGUSER=Digite o usuario do PostgreSQL (padrao: postgres): 
if "%PGUSER%"=="" set PGUSER=postgres

set /p PGPASSWORD=Digite a senha do PostgreSQL: 
if "%PGPASSWORD%"=="" (
    echo [ERRO] A senha e obrigatoria!
    pause
    exit /b 1
)

echo.
echo Criando banco de dados com configuracoes brasileiras...

:: Executar script SQL completo
psql -U %PGUSER% -f "%~dp0criar-banco-dados.sql"
if %errorlevel% equ 0 (
    echo [OK] Banco de dados configurado com sucesso
) else (
    echo [!] Erro ao configurar banco de dados
    echo Verifique se o PostgreSQL esta rodando e as credenciais estao corretas
    pause
    exit /b 1
)

echo.
echo Executando migracoes...
cd /d "%~dp0\..\backend"
npm run migrate

echo.
echo =========================================
echo   BANCO DE DADOS CONFIGURADO!
echo =========================================
echo.
echo Banco: pizzaria_db
echo Usuario: pizzaria_user
echo Senha: pizzaria_pass
echo.
pause