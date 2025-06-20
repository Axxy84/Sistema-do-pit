@echo off
echo =========================================
echo   COPIANDO ARQUIVO PARA AREA DE TRABALHO
echo =========================================
echo.

:: Copiar o arquivo para a área de trabalho
copy /Y "%~dp0Sistema-PIT-Desktop.bat" "%USERPROFILE%\Desktop\Sistema PIT.bat"

if %errorlevel% equ 0 (
    echo.
    echo =========================================
    echo   ARQUIVO COPIADO COM SUCESSO!
    echo =========================================
    echo.
    echo Na area de trabalho voce tem agora:
    echo   - Sistema PIT.bat
    echo.
    echo Clique duas vezes para iniciar o sistema!
    echo.
) else (
    echo.
    echo [ERRO] Falha ao copiar arquivo!
    echo.
)

pause