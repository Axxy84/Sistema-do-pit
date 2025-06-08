-- Adicionar colunas faltantes na tabela pedidos

-- Adicionar cupom_id se não existir
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_id UUID REFERENCES cupons(id);

-- Adicionar desconto_aplicado se não existir
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS desconto_aplicado DECIMAL(10,2) DEFAULT 0;

-- Adicionar pontos_ganhos se não existir
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pontos_ganhos INTEGER DEFAULT 0;

-- Adicionar pontos_resgatados se não existir
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pontos_resgatados INTEGER DEFAULT 0;

-- Adicionar multiplos_pagamentos se não existir
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS multiplos_pagamentos BOOLEAN DEFAULT FALSE;

-- Criar tabela cupons se não existir
CREATE TABLE IF NOT EXISTS cupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo_desconto VARCHAR(20) CHECK (tipo_desconto IN ('percentual', 'valor_fixo')) NOT NULL,
    valor_desconto DECIMAL(10,2) NOT NULL,
    valor_minimo_pedido DECIMAL(10,2),
    data_validade DATE,
    uso_unico BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela pagamentos_pedido se não existir
CREATE TABLE IF NOT EXISTS pagamentos_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_pedidos_cupom_id ON pedidos(cupom_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido_pedido_id ON pagamentos_pedido(pedido_id);