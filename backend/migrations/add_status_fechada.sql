-- Adiciona o status 'fechada' para pedidos de mesa que foram pagos
ALTER TABLE pedidos 
DROP CONSTRAINT IF EXISTS pedidos_status_pedido_check;

ALTER TABLE pedidos 
ADD CONSTRAINT pedidos_status_pedido_check 
CHECK (status_pedido IN ('pendente', 'preparando', 'pronto', 'saiu_para_entrega', 'entregue', 'cancelado', 'retirado', 'fechada'));

-- Comentário explicativo
COMMENT ON COLUMN pedidos.status_pedido IS 
'Status do pedido. Para mesas: retirado = em preparo/consumindo, fechada = conta paga';