-- Adiciona campo owner_access à tabela users para controle de acesso ao Tony Page
ALTER TABLE users 
ADD COLUMN owner_access BOOLEAN DEFAULT FALSE;

-- Atualizar o usuário admin para ter acesso de owner
UPDATE users 
SET owner_access = TRUE 
WHERE email = 'admin@pizzaria.com';

-- Comentário para documentar a coluna
COMMENT ON COLUMN users.owner_access IS 'Indica se o usuário tem acesso à área do dono (Tony Page)';