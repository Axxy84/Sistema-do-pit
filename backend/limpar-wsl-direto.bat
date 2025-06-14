@echo off
echo Executando limpeza do dashboard no PostgreSQL via WSL (comando direto)...

REM Executar o comando SQL diretamente no WSL
wsl PGPASSWORD=8477 psql -U postgres -d pizzaria_db -c "SET session_replication_role = 'replica'; TRUNCATE TABLE itens_pedido CASCADE; TRUNCATE TABLE pagamentos_pedido CASCADE; TRUNCATE TABLE pedidos CASCADE; TRUNCATE TABLE fechamento_caixa CASCADE; TRUNCATE TABLE despesas_receitas CASCADE; SET session_replication_role = 'origin'; SELECT 'pedidos' as tabela, COUNT(*) as registros FROM pedidos UNION ALL SELECT 'itens_pedido' as tabela, COUNT(*) as registros FROM itens_pedido UNION ALL SELECT 'fechamento_caixa' as tabela, COUNT(*) as registros FROM fechamento_caixa;"

echo.
echo Processo concluído! Verifique os resultados acima.
echo Lembre-se de reiniciar o servidor backend para limpar o cache em memória.
pause 