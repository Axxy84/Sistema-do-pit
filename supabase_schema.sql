CREATE TABLE pizzas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sabor VARCHAR(255) NOT NULL,
    tamanho VARCHAR(50) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    ingredientes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) UNIQUE,
    endereco TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entregadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    entregador_id UUID REFERENCES entregadores(id) ON DELETE SET NULL,
    status_pedido VARCHAR(50) NOT NULL DEFAULT 'pendente',
    data_pedido TIMESTAMPTZ DEFAULT NOW(),
    total DECIMAL(10, 2) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    pizza_id UUID REFERENCES pizzas(id) ON DELETE SET NULL, -- Permite manter o histórico mesmo se a pizza for deletada
    sabor_registrado VARCHAR(255), -- Para registrar o sabor no momento do pedido
    tamanho_registrado VARCHAR(50), -- Para registrar o tamanho no momento do pedido
    quantidade INT NOT NULL CHECK (quantidade > 0),
    valor_unitario DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE despesas_receitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('despesa', 'receita')),
    descricao TEXT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_transacao DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fechamento_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_fechamento DATE NOT NULL UNIQUE,
    total_vendas DECIMAL(10, 2) DEFAULT 0.00,
    total_descontos DECIMAL(10, 2) DEFAULT 0.00,
    total_impostos DECIMAL(10, 2) DEFAULT 0.00, -- Placeholder
    total_taxas_entrega DECIMAL(10, 2) DEFAULT 0.00, -- Placeholder
    total_despesas_extras DECIMAL(10, 2) DEFAULT 0.00,
    total_receitas_extras DECIMAL(10, 2) DEFAULT 0.00,
    saldo_final DECIMAL(10, 2) DEFAULT 0.00,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimizar consultas comuns
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_entregador_id ON pedidos(entregador_id);
CREATE INDEX idx_pedidos_data_pedido ON pedidos(data_pedido);
CREATE INDEX idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_pizza_id ON itens_pedido(pizza_id);
CREATE INDEX idx_despesas_receitas_data ON despesas_receitas(data_transacao);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para a tabela pedidos
CREATE TRIGGER set_timestamp_pedidos
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Adicionar algumas pizzas de exemplo (opcional)
INSERT INTO pizzas (sabor, tamanho, preco, ingredientes) VALUES
('Mussarela', 'Média', 30.00, 'Molho de tomate, queijo mussarela, orégano'),
('Calabresa', 'Grande', 45.00, 'Molho de tomate, queijo mussarela, calabresa fatiada, cebola, orégano'),
('Vegetariana', 'Pequena', 25.00, 'Molho de tomate, queijo mussarela, pimentão, cebola, azeitona, milho, orégano');

-- Adicionar alguns entregadores de exemplo (opcional)
INSERT INTO entregadores (nome, telefone, ativo) VALUES
('Carlos Silva', '(11) 98888-7777', TRUE),
('Ana Pereira', '(11) 97777-6666', TRUE);

-- Adicionar alguns clientes de exemplo (opcional)
INSERT INTO clientes (nome, telefone, endereco) VALUES
('João Cliente Teste', '(11) 91234-5678', 'Rua das Flores, 123, Bairro Jardim, Cidade Exemplo - SP'),
('Maria Cliente Exemplo', '(21) 98765-4321', 'Avenida Principal, 456, Centro, Outra Cidade - RJ');