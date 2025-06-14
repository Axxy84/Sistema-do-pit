-- Script para criar a tabela de bordas e inserir os dados do cardápio
-- Execute este script no PostgreSQL

-- Criar a tabela de bordas se não existir
CREATE TABLE IF NOT EXISTS bordas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    preco_adicional DECIMAL(10,2) NOT NULL DEFAULT 0,
    disponivel BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_bordas_disponivel ON bordas(disponivel);

-- Inserir as bordas do cardápio
INSERT INTO bordas (nome, preco_adicional, disponivel) VALUES
('Beijinho', 8.00, true),
('Brigadeiro', 8.00, true),
('Doce de Leite', 8.00, true),
('Goiabada', 7.00, true),
('Romeu e Julieta', 10.00, true),
('Nutella', 10.00, true)
ON CONFLICT DO NOTHING;

-- Verificar inserção
SELECT * FROM bordas ORDER BY nome;