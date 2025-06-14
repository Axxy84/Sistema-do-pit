#!/bin/bash

# Script para limpar os dados do dashboard no PostgreSQL rodando no WSL

echo "🔄 Iniciando limpeza do dashboard no PostgreSQL (WSL)..."

# Configurações do banco de dados
DB_NAME="pizzaria_db"
DB_USER="postgres"
DB_PASSWORD="8477"

# Criar arquivo SQL temporário
SQL_FILE="/tmp/limpar_dashboard.sql"

cat > $SQL_FILE << EOF
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
EOF

echo "📄 Arquivo SQL criado. Executando comandos no PostgreSQL..."

# Executar o script SQL no PostgreSQL
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f $SQL_FILE

echo "✅ Limpeza do dashboard concluída!"
echo "🔄 Agora você pode testar os cálculos reais do dashboard."
echo "⚠️ IMPORTANTE: Reinicie o servidor backend para limpar o cache em memória!"

# Remover arquivo SQL temporário
rm $SQL_FILE

echo "🧹 Arquivo SQL temporário removido." 