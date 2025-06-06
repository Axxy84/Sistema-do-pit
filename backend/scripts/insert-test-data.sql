-- Script de inserção de dados de teste para validação da migração

-- Inserir clientes de teste
INSERT INTO clientes (nome, telefone, endereco, email) VALUES
('João Silva', '(11) 99999-1234', 'Rua das Flores, 123', 'joao@email.com'),
('Maria Santos', '(11) 88888-5678', 'Av. Principal, 456', 'maria@email.com'),
('Pedro Costa', '(11) 77777-9012', 'Rua dos Amigos, 789', 'pedro@email.com'),
('Ana Oliveira', '(11) 66666-3456', 'Praça Central, 321', 'ana@email.com'),
('Carlos Ferreira', '(11) 55555-7890', 'Rua Nova, 654', 'carlos@email.com');

-- Inserir entregadores de teste
INSERT INTO entregadores (nome, telefone, ativo) VALUES
('Roberto Entregador', '(11) 91234-5678', true),
('Marcos Delivery', '(11) 92345-6789', true),
('José Moto', '(11) 93456-7890', true),
('Lucas Speed', '(11) 94567-8901', false);

-- Inserir ingredientes de teste
INSERT INTO ingredientes (nome, unidade_medida, quantidade_estoque, quantidade_minima, custo_unitario) VALUES
('Massa de Pizza', 'kg', 50.0, 10.0, 8.50),
('Molho de Tomate', 'litros', 20.0, 5.0, 12.00),
('Queijo Mussarela', 'kg', 25.0, 5.0, 28.00),
('Pepperoni', 'kg', 8.0, 2.0, 45.00),
('Presunto', 'kg', 6.0, 2.0, 22.00),
('Azeitona', 'kg', 3.0, 1.0, 15.00),
('Cebola', 'kg', 5.0, 1.0, 4.50),
('Pimentão', 'kg', 4.0, 1.0, 6.00),
('Champignon', 'kg', 2.0, 0.5, 18.00),
('Orégano', 'kg', 1.0, 0.2, 25.00);

-- Inserir produtos de teste
INSERT INTO produtos (nome, descricao, tipo_produto, categoria, preco_pequeno, preco_medio, preco_grande, disponivel) VALUES
('Pizza Margherita', 'Molho de tomate, mussarela e manjericão', 'pizza', 'Tradicionais', 25.00, 35.00, 45.00, true),
('Pizza Pepperoni', 'Molho de tomate, mussarela e pepperoni', 'pizza', 'Tradicionais', 30.00, 40.00, 50.00, true),
('Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos e cebola', 'pizza', 'Especiais', 32.00, 42.00, 52.00, true),
('Pizza Vegetariana', 'Molho de tomate, mussarela, pimentão, cebola e champignon', 'pizza', 'Especiais', 28.00, 38.00, 48.00, true),
('Refrigerante 2L', 'Coca-Cola, Pepsi ou Guaraná', 'bebida', 'Bebidas', 8.00, NULL, NULL, true),
('Água 500ml', 'Água mineral sem gás', 'bebida', 'Bebidas', 3.00, NULL, NULL, true);

-- Inserir cupons de teste
INSERT INTO cupons (codigo, descricao, tipo_desconto, valor_desconto, data_validade, usos_maximos, valor_minimo_pedido, ativo) VALUES
('PIZZA10', '10% de desconto em pedidos acima de R$ 30', 'percentual', 10.0, '2024-12-31 23:59:59', 100, 30.00, true),
('FRETE5', 'R$ 5 de desconto no frete', 'valor_fixo', 5.0, '2024-12-31 23:59:59', 50, 20.00, true),
('BEMVINDO', '15% para novos clientes', 'percentual', 15.0, '2024-12-31 23:59:59', NULL, 25.00, true),
('PROMO20', 'R$ 20 de desconto', 'valor_fixo', 20.0, '2024-06-30 23:59:59', 20, 50.00, false);

-- Inserir despesas/receitas de teste
INSERT INTO despesas_receitas (tipo, valor, descricao, data_transacao) VALUES
('despesa', 150.00, 'Compra de ingredientes', CURRENT_DATE),
('despesa', 80.00, 'Conta de luz', CURRENT_DATE),
('despesa', 120.00, 'Salário entregador', CURRENT_DATE),
('receita', 50.00, 'Venda de embalagens', CURRENT_DATE),
('despesa', 200.00, 'Fornecedor de massa', CURRENT_DATE - INTERVAL '1 day'),
('despesa', 90.00, 'Gás de cozinha', CURRENT_DATE - INTERVAL '2 days');

-- Inserir alguns pedidos de teste
INSERT INTO pedidos (
  cliente_id, entregador_id, total, forma_pagamento, valor_pago, troco_calculado,
  cupom_id, desconto_aplicado, pontos_ganhos, pontos_resgatados, 
  observacoes, status_pedido, data_pedido
) VALUES
(1, 1, 45.00, 'dinheiro', 50.00, 5.00, NULL, 0.00, 5, 0, 'Sem cebola', 'entregue', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(2, 2, 38.00, 'cartao', 38.00, 0.00, 1, 4.20, 4, 0, '', 'entregue', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(3, 1, 65.00, 'pix', 65.00, 0.00, NULL, 0.00, 7, 0, 'Caprichar no queijo', 'saiu_entrega', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
(4, NULL, 28.00, 'dinheiro', 30.00, 2.00, NULL, 0.00, 3, 0, 'Retirada no balcão', 'pronto', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
(5, 3, 52.00, 'cartao', 52.00, 0.00, 2, 5.00, 5, 0, '', 'preparando', CURRENT_TIMESTAMP - INTERVAL '10 minutes');

-- Inserir itens dos pedidos
-- Pedido 1: Pizza Grande Margherita
INSERT INTO itens_pedido (pedido_id, produto_id_ref, sabor_registrado, tamanho_registrado, quantidade, valor_unitario) VALUES
(1, 1, 'Margherita', 'grande', 1, 45.00);

-- Pedido 2: Pizza Média Pepperoni com desconto
INSERT INTO itens_pedido (pedido_id, produto_id_ref, sabor_registrado, tamanho_registrado, quantidade, valor_unitario) VALUES
(2, 2, 'Pepperoni', 'medio', 1, 40.00),
(2, 5, 'Refrigerante 2L', NULL, 1, 8.00);

-- Pedido 3: Pizza Grande Portuguesa + Bebidas
INSERT INTO itens_pedido (pedido_id, produto_id_ref, sabor_registrado, tamanho_registrado, quantidade, valor_unitario) VALUES
(3, 3, 'Portuguesa', 'grande', 1, 52.00),
(3, 5, 'Refrigerante 2L', NULL, 1, 8.00),
(3, 6, 'Água 500ml', NULL, 2, 3.00);

-- Pedido 4: Pizza Pequena Vegetariana
INSERT INTO itens_pedido (pedido_id, produto_id_ref, sabor_registrado, tamanho_registrado, quantidade, valor_unitario) VALUES
(4, 4, 'Vegetariana', 'pequeno', 1, 28.00);

-- Pedido 5: Pizza Média Margherita + Refrigerante
INSERT INTO itens_pedido (pedido_id, produto_id_ref, sabor_registrado, tamanho_registrado, quantidade, valor_unitario) VALUES
(5, 1, 'Margherita', 'medio', 1, 35.00),
(5, 5, 'Refrigerante 2L', NULL, 1, 8.00);

-- Atualizar contadores de uso dos cupons
UPDATE cupons SET usos_atuais = 1 WHERE id = 1;
UPDATE cupons SET usos_atuais = 1 WHERE id = 2;

COMMIT; 