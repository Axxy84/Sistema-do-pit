-- Atualizar constraint para incluir status 'retirado'
ALTER TABLE pedidos 
DROP CONSTRAINT IF EXISTS pedidos_status_pedido_check;

ALTER TABLE pedidos 
ADD CONSTRAINT pedidos_status_pedido_check 
CHECK (status_pedido IN ('pendente', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'retirado', 'cancelado'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN pedidos.status_pedido IS 'Status do pedido. "retirado" é usado para pedidos de mesa que foram pagos e retirados pelo cliente';