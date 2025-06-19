@echo off
echo ===========================
echo SUBINDO SISTEMA COM DOCKER
echo ===========================
echo.

REM Subir todos os containers
docker-compose up -d

echo.
echo ===========================
echo SISTEMA RODANDO!
echo ===========================
echo.
echo Acesse: http://localhost
echo.
echo Login: admin@pizzaria.com
echo Senha: admin123
echo.
echo Para parar: docker-compose down
echo ===========================
pause