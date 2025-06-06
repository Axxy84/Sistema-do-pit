ALTER TABLE produtos
DROP CONSTRAINT IF EXISTS produtos_tipo_produto_check;

ALTER TABLE produtos
ADD CONSTRAINT produtos_tipo_produto_check 
CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento', 'outro', 'borda'));

-- Verificar se a alteração foi aplicada (opcional, apenas para debug)
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'produtos'::regclass AND conname = 'produtos_tipo_produto_check'; 