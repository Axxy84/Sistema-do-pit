#!/bin/bash
# =====================================================
# SCRIPT PARA ATUALIZAR .ENV E REINICIAR SERVIÇOS
# Autor: Claude Code
# =====================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações do banco
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="pizzaria_db"
DB_USER="pizzaria_user"
DB_PASSWORD="SenhaF0rte!"

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"
ENV_BACKUP="$SCRIPT_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ATUALIZADOR DE CONFIGURAÇÃO DO BANCO${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado em: $ENV_FILE${NC}"
    echo -e "${YELLOW}Criando novo arquivo .env...${NC}"
    
    # Criar .env básico
    cat > "$ENV_FILE" << EOF
# Banco de Dados
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Aplicação
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
EOF
    
    echo -e "${GREEN}✓ Arquivo .env criado${NC}"
else
    # 2. Fazer backup do .env atual
    cp "$ENV_FILE" "$ENV_BACKUP"
    echo -e "${GREEN}✓ Backup criado: $ENV_BACKUP${NC}"
    
    # 3. Atualizar variáveis no .env
    echo -e "${YELLOW}Atualizando configurações...${NC}"
    
    # Função para atualizar ou adicionar variável
    update_env_var() {
        local key=$1
        local value=$2
        
        if grep -q "^${key}=" "$ENV_FILE"; then
            # Variável existe, atualizar
            sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        else
            # Variável não existe, adicionar
            echo "${key}=${value}" >> "$ENV_FILE"
        fi
    }
    
    # Atualizar cada variável
    update_env_var "DB_HOST" "$DB_HOST"
    update_env_var "DB_PORT" "$DB_PORT"
    update_env_var "DB_USER" "$DB_USER"
    update_env_var "DB_PASSWORD" "$DB_PASSWORD"
    update_env_var "DB_NAME" "$DB_NAME"
    
    echo -e "${GREEN}✓ Variáveis atualizadas${NC}"
fi

# 4. Testar conexão com o banco
echo ""
echo -e "${YELLOW}Testando conexão com o banco...${NC}"

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Conexão com banco de dados OK${NC}"
    CONNECTION_OK=true
else
    echo -e "${RED}✗ Falha na conexão com banco de dados${NC}"
    echo -e "${YELLOW}Verifique se o PostgreSQL está rodando e o usuário foi criado${NC}"
    echo -e "${YELLOW}Execute primeiro: sudo -u postgres psql < scripts/setup-db-user.sql${NC}"
    CONNECTION_OK=false
fi

# 5. Reiniciar serviços
echo ""
echo -e "${YELLOW}Verificando serviços...${NC}"

# Verificar Docker Compose
if [ -f "$SCRIPT_DIR/docker-compose.yml" ] || [ -f "$SCRIPT_DIR/../docker-compose.yml" ]; then
    echo -e "${BLUE}Docker Compose detectado${NC}"
    
    # Tentar docker-compose primeiro (versão antiga)
    if command -v docker-compose &> /dev/null; then
        echo "Reiniciando com docker-compose..."
        docker-compose down
        docker-compose up -d
    # Tentar docker compose (versão nova)
    elif docker compose version &> /dev/null; then
        echo "Reiniciando com docker compose..."
        docker compose down
        docker compose up -d
    else
        echo -e "${YELLOW}⚠️  Docker Compose não está instalado${NC}"
    fi
    
# Verificar systemd service
elif systemctl is-active --quiet pizzaria 2>/dev/null; then
    echo -e "${BLUE}Serviço systemd detectado${NC}"
    echo "Reiniciando serviço pizzaria..."
    sudo systemctl restart pizzaria
    
    # Verificar status
    if systemctl is-active --quiet pizzaria; then
        echo -e "${GREEN}✓ Serviço reiniciado com sucesso${NC}"
    else
        echo -e "${RED}✗ Falha ao reiniciar serviço${NC}"
    fi
    
# Verificar PM2
elif command -v pm2 &> /dev/null && pm2 list | grep -q "pizzaria"; then
    echo -e "${BLUE}PM2 detectado${NC}"
    echo "Reiniciando aplicação no PM2..."
    pm2 restart pizzaria
    
else
    echo -e "${YELLOW}⚠️  Nenhum serviço detectado para reiniciar${NC}"
    echo -e "${YELLOW}Você precisará reiniciar a aplicação manualmente${NC}"
fi

# 6. Resumo final
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RESUMO DA CONFIGURAÇÃO${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Host: ${GREEN}$DB_HOST:$DB_PORT${NC}"
echo -e "Banco: ${GREEN}$DB_NAME${NC}"
echo -e "Usuário: ${GREEN}$DB_USER${NC}"
echo -e "Senha: ${GREEN}***${NC}"

if [ "$CONNECTION_OK" = true ]; then
    echo -e ""
    echo -e "${GREEN}✓ Configuração concluída com sucesso!${NC}"
    exit 0
else
    echo -e ""
    echo -e "${RED}✗ Configuração concluída com erros${NC}"
    exit 1
fi

# Autor: Claude Code