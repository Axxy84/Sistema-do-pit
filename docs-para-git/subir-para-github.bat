@echo off
echo ===================================
echo SUBINDO DOCUMENTACAO PARA O GITHUB
echo ===================================
echo.

REM Inicializar repositório
git init

REM Adicionar remote
git remote add origin https://github.com/Axxy84/Dock.git

REM Adicionar arquivos
git add .

REM Commit
git commit -m "Documentação completa de instalação do Sistema Pizzaria com Docker"

REM Push
git branch -M main
git push -u origin main

echo.
echo ===================================
echo DOCUMENTACAO ENVIADA COM SUCESSO!
echo ===================================
echo.
echo Acesse: https://github.com/Axxy84/Dock
echo.
pause