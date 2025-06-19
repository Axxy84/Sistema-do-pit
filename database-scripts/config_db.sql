-- Script de configuração do banco
-- Execute: psql -U postgres -f config_db.sql

-- Criar banco de dados
CREATE DATABASE pizzaria_db;

-- Criar usuário
CREATE USER pizzaria_user WITH PASSWORD '8477';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;

-- Configurar senha do postgres
ALTER USER postgres PASSWORD '8477';

-- Verificar criação
\l
\du