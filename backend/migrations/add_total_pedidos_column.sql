-- Script de migração para adicionar coluna total_pedidos
-- Este script é seguro e não quebrará se a coluna já existir

-- Verifica se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fechamento_caixa' 
        AND column_name = 'total_pedidos'
    ) THEN
        ALTER TABLE fechamento_caixa 
        ADD COLUMN total_pedidos NUMERIC DEFAULT 0;
        
        -- Adiciona comentário para documentação
        COMMENT ON COLUMN fechamento_caixa.total_pedidos IS 'Total de pedidos entregues no dia do fechamento';
        
        RAISE NOTICE 'Coluna total_pedidos adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna total_pedidos já existe, pulando alteração';
    END IF;
END $$;

-- Atualiza registros existentes com o total de pedidos (opcional)
-- Esta query conta os pedidos entregues para cada fechamento existente
UPDATE fechamento_caixa fc
SET total_pedidos = (
    SELECT COUNT(*)
    FROM pedidos p
    WHERE DATE(p.created_at) = fc.data_fechamento
    AND p.status_pedido = 'entregue'
)
WHERE fc.total_pedidos IS NULL OR fc.total_pedidos = 0;

-- Cria índice para melhorar performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_fechamento_caixa_data 
ON fechamento_caixa(data_fechamento);

-- Verifica se a alteração foi aplicada
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'fechamento_caixa'
AND column_name = 'total_pedidos'; 