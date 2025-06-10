-- Migração para suportar múltiplos sabores por pizza
-- Adiciona coluna sabores_registrados na tabela itens_pedido
-- Mantém compatibilidade com sabor_registrado existente

ALTER TABLE itens_pedido 
ADD COLUMN sabores_registrados JSONB;

-- Comentário explicativo da estrutura esperada:
-- sabores_registrados: [
--   {"nome": "Calabresa", "produto_id": "uuid", "percentual": 50},
--   {"nome": "Mussarela", "produto_id": "uuid", "percentual": 50}
-- ]
-- Para família com 3 sabores: percentuais 33, 33, 34

-- Não removemos sabor_registrado para manter compatibilidade
COMMENT ON COLUMN itens_pedido.sabores_registrados IS 
'JSONB array para múltiplos sabores. Para pizzas tradicionais (1 sabor), usar sabor_registrado. Para múltiplos sabores, usar este campo.';