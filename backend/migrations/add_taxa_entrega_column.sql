-- Script de migração para adicionar coluna taxa_entrega na tabela pedidos
-- Este script verifica se a coluna já existe antes de adicionar

DO $$
BEGIN
    -- Verificar se a coluna taxa_entrega já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'taxa_entrega'
    ) THEN
        -- Adicionar coluna taxa_entrega
        ALTER TABLE pedidos 
        ADD COLUMN taxa_entrega NUMERIC(10,2) DEFAULT 0.00;
        
        -- Adicionar comentário à coluna
        COMMENT ON COLUMN pedidos.taxa_entrega IS 'Taxa de entrega aplicada ao pedido (apenas para delivery)';
        
        RAISE NOTICE 'Coluna taxa_entrega adicionada com sucesso à tabela pedidos';
    ELSE
        RAISE NOTICE 'Coluna taxa_entrega já existe na tabela pedidos, pulando alteração';
    END IF;
END $$; 