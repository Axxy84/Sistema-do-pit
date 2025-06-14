-- Script para inserir as pizzas do cardápio no sistema
-- Utiliza a estrutura existente da tabela produtos com JSONB para tamanhos_precos

-- Limpar pizzas existentes (opcional - remova o comentário se quiser limpar antes)
-- DELETE FROM produtos WHERE tipo_produto = 'pizza';

-- Inserir as pizzas do cardápio
INSERT INTO produtos (nome, tipo_produto, categoria, tamanhos_precos, ativo) VALUES
('Bacon', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 29.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 36.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 47.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 53.00}
]'::jsonb, true),

('Bacon com Milho', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 31.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 38.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 49.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 55.00}
]'::jsonb, true),

('Baiana', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 29.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 38.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 46.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 55.00}
]'::jsonb, true),

('Bauru', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 28.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 37.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 45.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 50.00}
]'::jsonb, true),

('Brasileira', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 29.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 38.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 43.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 49.00}
]'::jsonb, true),

('Brócolis', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 32.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 36.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 45.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 48.00}
]'::jsonb, true),

('Brócolis com Bacon', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 33.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 38.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 46.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 49.00}
]'::jsonb, true),

('Calabresa', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 28.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 38.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 48.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 56.00}
]'::jsonb, true),

('Calabresa ao Catupiry', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 30.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 39.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 49.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 57.00}
]'::jsonb, true),

('Calabresa com Cheddar', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 32.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 41.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 50.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 59.00}
]'::jsonb, true),

('Calabresa Paulista', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 27.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 33.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 42.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 45.00}
]'::jsonb, true),

('Camarão', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 35.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 39.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 50.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 59.00}
]'::jsonb, true),

('Camarão ao Catupiry', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 38.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 42.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 53.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 62.00}
]'::jsonb, true),

('Canadense', 'pizza', 'salgada', '[
    {"id_tamanho": "pequena", "tamanho": "Pequena", "preco": 34.00},
    {"id_tamanho": "media", "tamanho": "Média", "preco": 39.00},
    {"id_tamanho": "grande", "tamanho": "Grande", "preco": 45.00},
    {"id_tamanho": "familia", "tamanho": "Família", "preco": 52.00}
]'::jsonb, true);

-- Verificar inserção
SELECT nome, tipo_produto, categoria, tamanhos_precos FROM produtos WHERE tipo_produto = 'pizza' ORDER BY nome;