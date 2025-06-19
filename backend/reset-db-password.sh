#!/bin/bash

echo "=== RESET DE SENHA DO POSTGRESQL ==="
echo ""
echo "Este script vai ajudar a resetar a senha do usuário pizzaria_user"
echo "Você precisará ter acesso sudo ou ser o usuário postgres"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se pode executar como postgres
echo "Tentando conectar ao PostgreSQL..."

# Opção 1: Tentar com sudo
echo -e "${YELLOW}Método 1: Usando sudo${NC}"
echo "Executando: sudo -u postgres psql"
echo ""
echo "Cole e execute estes comandos no PostgreSQL:"
echo -e "${GREEN}"
echo "ALTER USER pizzaria_user WITH PASSWORD 'nova_senha_123';"
echo "\\q"
echo -e "${NC}"
echo ""
echo "OU se preferir, execute este comando direto:"
echo -e "${GREEN}sudo -u postgres psql -c \"ALTER USER pizzaria_user WITH PASSWORD 'nova_senha_123';\"${NC}"
echo ""

echo -e "${YELLOW}Método 2: Se você tem a senha do usuário postgres${NC}"
echo "Execute:"
echo -e "${GREEN}psql -h localhost -U postgres -c \"ALTER USER pizzaria_user WITH PASSWORD 'nova_senha_123';\"${NC}"
echo ""

echo -e "${YELLOW}Método 3: Criar novo usuário (se pizzaria_user não existir)${NC}"
echo -e "${GREEN}"
echo "sudo -u postgres psql"
echo "CREATE USER pizzaria_user WITH PASSWORD 'nova_senha_123';"
echo "GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;"
echo "\\q"
echo -e "${NC}"

echo ""
echo "Após resetar a senha, atualize o arquivo .env:"
echo -e "${GREEN}DB_PASSWORD=nova_senha_123${NC}"
echo ""
echo "Ou execute novamente: node verify_password.js"