@echo off
echo ===============================================
echo LIMPEZA COMPLETA DE DADOS DO DASHBOARD (WSL)
echo ===============================================
echo.

echo [1/7] Desativando restrições de chave estrangeira...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "SET session_replication_role = 'replica';"

echo.
echo [2/7] Limpando tabela itens_pedido...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "TRUNCATE TABLE itens_pedido CASCADE;"

echo.
echo [3/7] Limpando tabela pagamentos_pedido (se existir)...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "DROP TABLE IF EXISTS pagamentos_pedido CASCADE;"

echo.
echo [4/7] Limpando tabela pedidos...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "TRUNCATE TABLE pedidos CASCADE;"

echo.
echo [5/7] Limpando tabela fechamento_caixa...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "TRUNCATE TABLE fechamento_caixa CASCADE;"

echo.
echo [6/7] Limpando tabela despesas_receitas (se existir)...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "TRUNCATE TABLE despesas_receitas CASCADE;"

echo.
echo [7/7] Restaurando restrições de chave estrangeira...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "SET session_replication_role = 'origin';"

echo.
echo Verificando se as tabelas foram limpas...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "SELECT 'pedidos' as tabela, COUNT(*) as registros FROM pedidos UNION ALL SELECT 'itens_pedido' as tabela, COUNT(*) as registros FROM itens_pedido UNION ALL SELECT 'fechamento_caixa' as tabela, COUNT(*) as registros FROM fechamento_caixa;"

echo.
echo ===============================================
echo LIMPANDO CACHE DO DASHBOARD
echo ===============================================

echo.
echo Tentando limpar tabela de cache (se existir)...
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "DELETE FROM cache WHERE key LIKE '%%dashboard%%';"

echo.
echo ===============================================
echo VERIFICANDO DADOS MOCKADOS
echo ===============================================

echo.
echo Verificando se existem dados mockados no localStorage...
echo Por favor, execute este comando no console do navegador:
echo.
echo localStorage.clear();
echo location.reload();
echo.

echo ===============================================
echo PROCESSO CONCLUÍDO!
echo ===============================================
echo.
echo IMPORTANTE: Reinicie o servidor backend para limpar o cache em memória!
echo.
pause 