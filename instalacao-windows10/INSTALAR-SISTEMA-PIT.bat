@echo off
title Instalador Sistema PIT v1.0
color 0C
mode con: cols=80 lines=30

echo.
echo  ============================================================================
echo                           SISTEMA PIT - INSTALADOR
echo                          Versao 1.0 - Windows 10/11
echo  ============================================================================
echo.
echo                     Este instalador ira configurar:
echo.
echo                     [+] Node.js e dependencias
echo                     [+] PostgreSQL Database  
echo                     [+] Sistema PIT completo
echo                     [+] Aplicativo Desktop (Electron)
echo.
echo  ============================================================================
echo.
echo       ATENCAO: Execute este arquivo como ADMINISTRADOR!
echo.
echo  ============================================================================
echo.
echo.
echo       Pressione qualquer tecla para iniciar a instalacao...
echo.
pause >nul

:: Verificar se é admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 4F
    cls
    echo.
    echo  ============================================================================
    echo                                    ERRO!
    echo  ============================================================================
    echo.
    echo       Este instalador PRECISA ser executado como ADMINISTRADOR!
    echo.
    echo       1. Feche esta janela
    echo       2. Clique com botao direito no arquivo
    echo       3. Selecione "Executar como administrador"
    echo.
    echo  ============================================================================
    echo.
    pause
    exit /b 1
)

cls
cd /d "%~dp0"

:: Menu de opcoes
:MENU
cls
echo.
echo  ============================================================================
echo                        SISTEMA PIT - TIPO DE INSTALACAO
echo  ============================================================================
echo.
echo       Escolha o tipo de instalacao:
echo.
echo       [1] Instalacao Completa com App Desktop (Electron)
echo       [2] Instalacao Simples (Navegador Web)
echo       [3] Apenas Configurar Banco de Dados
echo       [4] Verificar Instalacao
echo       [5] Sair
echo.
echo  ============================================================================
echo.
set /p opcao="      Digite sua opcao (1-5): "

if "%opcao%"=="1" goto ELECTRON
if "%opcao%"=="2" goto SIMPLES
if "%opcao%"=="3" goto BANCO
if "%opcao%"=="4" goto VERIFICAR
if "%opcao%"=="5" exit

goto MENU

:ELECTRON
cls
echo.
echo  ============================================================================
echo                     INSTALANDO SISTEMA PIT - APP DESKTOP
echo  ============================================================================
echo.
call instalar-com-electron.bat
goto FIM

:SIMPLES
cls
echo.
echo  ============================================================================
echo                   INSTALANDO SISTEMA PIT - VERSAO WEB
echo  ============================================================================
echo.
call instalar-sistema-completo.bat
goto FIM

:BANCO
cls
echo.
echo  ============================================================================
echo                      CONFIGURANDO BANCO DE DADOS
echo  ============================================================================
echo.
call configurar-banco-dados.bat
goto FIM

:VERIFICAR
cls
echo.
echo  ============================================================================
echo                        VERIFICANDO INSTALACAO
echo  ============================================================================
echo.
call diagnostico-instalacao.bat
pause
goto MENU

:FIM
echo.
echo  ============================================================================
echo                          INSTALACAO CONCLUIDA!
echo  ============================================================================
echo.
echo       Para iniciar o sistema:
echo.
echo       - App Desktop: Execute "sistema-pit.bat"
echo       - Navegador: Execute "iniciar-sistema.bat"
echo.
echo       Credenciais de acesso:
echo       Email: admin@pizzaria.com
echo       Senha: admin123
echo.
echo  ============================================================================
echo.
pause