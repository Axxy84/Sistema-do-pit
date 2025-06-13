-- Configuração do PostgreSQL WSL
CREATE DATABASE pizzaria_db;
CREATE USER pizzaria_user WITH PASSWORD '8477';
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
ALTER USER postgres PASSWORD '8477';
\q