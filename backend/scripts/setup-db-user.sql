-- =====================================================
-- SCRIPT IDEMPOTENTE PARA CRIAR/ATUALIZAR USUÁRIO E BANCO
-- Autor: Claude Code
-- =====================================================

-- Função auxiliar para verificar se role existe
DO $$
BEGIN
    -- Criar role se não existir
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pizzaria_user') THEN
        CREATE ROLE pizzaria_user WITH LOGIN PASSWORD 'SenhaF0rte!';
        RAISE NOTICE 'Role pizzaria_user criado com sucesso';
    ELSE
        -- Se já existir, apenas atualizar a senha
        ALTER ROLE pizzaria_user WITH PASSWORD 'SenhaF0rte!';
        RAISE NOTICE 'Senha do role pizzaria_user atualizada';
    END IF;
    
    -- Garantir privilégios de criação de banco
    ALTER ROLE pizzaria_user CREATEDB;
END
$$;

-- Verificar e criar banco se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pizzaria_db') THEN
        -- Criar banco e atribuir ownership
        CREATE DATABASE pizzaria_db OWNER pizzaria_user;
        RAISE NOTICE 'Banco pizzaria_db criado com sucesso';
    ELSE
        -- Se já existir, garantir ownership correto
        ALTER DATABASE pizzaria_db OWNER TO pizzaria_user;
        RAISE NOTICE 'Ownership do banco pizzaria_db atualizado';
    END IF;
END
$$;

-- Conectar ao banco pizzaria_db para configurar permissões
\c pizzaria_db

-- Garantir todas as permissões no schema public
GRANT ALL ON SCHEMA public TO pizzaria_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pizzaria_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pizzaria_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO pizzaria_user;

-- Definir como owner padrão para novos objetos
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pizzaria_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pizzaria_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO pizzaria_user;

-- Criar extensões necessárias se não existirem
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Configuração concluída com sucesso!';
    RAISE NOTICE 'Usuário: pizzaria_user';
    RAISE NOTICE 'Senha: SenhaF0rte!';
    RAISE NOTICE 'Banco: pizzaria_db';
    RAISE NOTICE '========================================';
END
$$;

-- Autor: Claude Code