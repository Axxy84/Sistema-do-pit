-- Script para limpar todos os dados do dashboard
-- Este script usa TRUNCATE CASCADE para ignorar restrições de chave estrangeira

-- Desativar verificação de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- Limpar tabelas dependentes primeiro
TRUNCATE TABLE itens_pedido CASCADE;
TRUNCATE TABLE pagamentos_pedido CASCADE;

-- Limpar tabelas principais
TRUNCATE TABLE pedidos CASCADE;
TRUNCATE TABLE fechamento_caixa CASCADE;
TRUNCATE TABLE despesas_receitas CASCADE;

-- Restaurar verificação de chave estrangeira
SET session_replication_role = 'origin';

-- Verificar se as tabelas foram limpas
SELECT 'pedidos' as tabela, COUNT(*) as registros FROM pedidos
UNION ALL
SELECT 'itens_pedido' as tabela, COUNT(*) as registros FROM itens_pedido
UNION ALL
SELECT 'fechamento_caixa' as tabela, COUNT(*) as registros FROM fechamento_caixa; 