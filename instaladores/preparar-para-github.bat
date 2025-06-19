@echo off
echo ========================================
echo   PREPARANDO SISTEMA PARA GITHUB
echo ========================================
echo.

REM Adicionar todos os arquivos novos e modificados
echo 📝 Adicionando arquivos ao git...
git add -A

REM Criar commit com mensagem descritiva
echo 💾 Criando commit...
git commit -m "Sistema 100%% pronto para instalação no cliente - Build de produção incluído"

REM Fazer push para o GitHub
echo 📤 Enviando para GitHub...
git push origin master

echo.
echo ✅ Sistema enviado para GitHub!
echo.
echo Para baixar em outra máquina, use:
echo git clone [URL_DO_SEU_REPOSITORIO]
echo.
pause