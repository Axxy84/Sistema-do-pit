-- Script de criação do banco de dados pizzaria_db
-- Execute este script como usuário postgres

-- Remove o banco se já existir (CUIDADO: isso apagará todos os dados!)
-- DROP DATABASE IF EXISTS pizzaria_db;

-- Cria o banco de dados com configurações para português do Brasil
CREATE DATABASE pizzaria_db
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- Conectar ao banco criado
\c pizzaria_db;

-- Criar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar usuário da aplicação (se não existir)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_user
      WHERE usename = 'pizzaria_user') THEN
      
      CREATE USER pizzaria_user WITH PASSWORD 'pizzaria_pass';
   END IF;
END
$do$;

-- Conceder permissões ao usuário
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
GRANT ALL ON SCHEMA public TO pizzaria_user;