-- Adiciona campo categoria à tabela despesas_receitas
ALTER TABLE despesas_receitas 
ADD COLUMN categoria VARCHAR(50) DEFAULT 'outro';

-- Atualizar valores existentes
UPDATE despesas_receitas 
SET categoria = 'outro' 
WHERE categoria IS NULL;

-- Adicionar constraint para valores válidos
ALTER TABLE despesas_receitas 
ADD CONSTRAINT check_categoria 
CHECK (categoria IN ('fixa', 'insumos', 'taxa', 'outro'));

-- Comentário para documentar a coluna
COMMENT ON COLUMN despesas_receitas.categoria IS 'Categoria da despesa: fixa, insumos, taxa, outro';