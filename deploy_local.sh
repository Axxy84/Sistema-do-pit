#!/bin/bash
# =====================================================
# SCRIPT DE DEPLOY LOCAL COMPLETO
# Autor: Claude Code
# =====================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório raiz do projeto (onde este script está)
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
SQL_SCRIPT="$BACKEND_DIR/scripts/setup-db-user.sql"
UPDATE_SCRIPT="$BACKEND_DIR/update_env.sh"

# Variáveis de status
POSTGRES_OK=false
UPDATE_ENV_OK=false
ERRORS=""

# Banner inicial
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}      DEPLOY LOCAL - SISTEMA PIZZARIA   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Função para exibir erro e sair
error_exit() {
    echo -e "${RED}✗ ERRO: $1${NC}" >&2
    echo -e "${RED}Deploy abortado.${NC}"
    exit 1
}

# Função para adicionar erro ao resumo
add_error() {
    ERRORS="${ERRORS}\n  ${RED}✗${NC} $1"
}

# 1. Verificar arquivos necessários
echo -e "${YELLOW}1. Verificando arquivos necessários...${NC}"

if [ ! -f "$SQL_SCRIPT" ]; then
    error_exit "Arquivo SQL não encontrado: $SQL_SCRIPT"
fi

if [ ! -f "$UPDATE_SCRIPT" ]; then
    error_exit "Script de atualização não encontrado: $UPDATE_SCRIPT"
fi

if [ ! -x "$UPDATE_SCRIPT" ]; then
    echo -e "${YELLOW}  Tornando script executável...${NC}"
    chmod +x "$UPDATE_SCRIPT"
fi

echo -e "${GREEN}  ✓ Todos os arquivos encontrados${NC}"
echo ""

# 2. Verificar método de acesso ao PostgreSQL
echo -e "${YELLOW}2. Configurando acesso ao PostgreSQL...${NC}"

# Verificar se foi passada senha como variável de ambiente
if [ ! -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${BLUE}  Usando senha fornecida via POSTGRES_PASSWORD${NC}"
    PSQL_COMMAND="PGPASSWORD=$POSTGRES_PASSWORD psql -U postgres"
    
# Verificar se podemos usar sudo sem senha
elif sudo -n true 2>/dev/null; then
    echo -e "${BLUE}  Usando sudo (sem senha necessária)${NC}"
    PSQL_COMMAND="sudo -u postgres psql"
    
# Verificar se somos o usuário postgres
elif [ "$USER" = "postgres" ]; then
    echo -e "${BLUE}  Executando como usuário postgres${NC}"
    PSQL_COMMAND="psql"
    
else
    echo -e "${YELLOW}  Nenhum método automático disponível${NC}"
    echo -e "${YELLOW}  Opções disponíveis:${NC}"
    echo -e "${YELLOW}    1. Execute com: POSTGRES_PASSWORD=sua_senha $0${NC}"
    echo -e "${YELLOW}    2. Configure sudo sem senha para o usuário postgres${NC}"
    echo -e "${YELLOW}    3. Execute como root/sudo${NC}"
    error_exit "Não foi possível configurar acesso ao PostgreSQL"
fi

echo -e "${GREEN}  ✓ Acesso ao PostgreSQL configurado${NC}"
echo ""

# 3. Executar script SQL
echo -e "${YELLOW}3. Criando/atualizando usuário e banco de dados...${NC}"

# Executar o script e capturar saída
SQL_OUTPUT=$(mktemp)
if $PSQL_COMMAND -f "$SQL_SCRIPT" > "$SQL_OUTPUT" 2>&1; then
    echo -e "${GREEN}  ✓ Script SQL executado com sucesso${NC}"
    POSTGRES_OK=true
    
    # Mostrar mensagens NOTICE do PostgreSQL
    if grep -q "NOTICE:" "$SQL_OUTPUT"; then
        echo -e "${BLUE}  Mensagens do PostgreSQL:${NC}"
        grep "NOTICE:" "$SQL_OUTPUT" | sed 's/^/    /'
    fi
else
    echo -e "${RED}  ✗ Falha ao executar script SQL${NC}"
    add_error "Configuração do PostgreSQL falhou"
    
    # Mostrar erro
    echo -e "${RED}  Erro:${NC}"
    cat "$SQL_OUTPUT" | tail -10 | sed 's/^/    /'
fi
rm -f "$SQL_OUTPUT"
echo ""

# 4. Executar script de atualização do .env
if [ "$POSTGRES_OK" = true ]; then
    echo -e "${YELLOW}4. Atualizando configurações e testando conexão...${NC}"
    
    # Mudar para o diretório backend para executar o script
    cd "$BACKEND_DIR"
    
    # Executar script e capturar código de saída
    if ./update_env.sh; then
        UPDATE_ENV_OK=true
        echo -e "${GREEN}  ✓ Configurações atualizadas com sucesso${NC}"
    else
        add_error "Atualização do .env ou teste de conexão falhou"
        echo -e "${RED}  ✗ Falha na atualização das configurações${NC}"
    fi
    
    # Voltar ao diretório original
    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}4. Pulando atualização do .env (PostgreSQL falhou)${NC}"
    add_error "Atualização do .env não executada"
fi
echo ""

# 5. Executar migrações se tudo estiver OK
if [ "$POSTGRES_OK" = true ] && [ "$UPDATE_ENV_OK" = true ]; then
    echo -e "${YELLOW}5. Executando migrações do banco...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Verificar se npm está instalado
    if command -v npm &> /dev/null; then
        if npm run migrate 2>/dev/null; then
            echo -e "${GREEN}  ✓ Migrações executadas com sucesso${NC}"
        else
            echo -e "${YELLOW}  ⚠ Script de migração não encontrado ou falhou${NC}"
            add_error "Migrações não executadas (verificar manualmente)"
        fi
    else
        echo -e "${YELLOW}  ⚠ npm não instalado - pulando migrações${NC}"
        add_error "npm não encontrado - instalar dependências manualmente"
    fi
    
    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}5. Pulando migrações (etapas anteriores falharam)${NC}"
fi
echo ""

# 6. Folha de Status Final
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}         RESUMO DO DEPLOY LOCAL         ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Status de cada etapa
echo -e "${BLUE}Etapas executadas:${NC}"
if [ "$POSTGRES_OK" = true ]; then
    echo -e "  ${GREEN}✓${NC} Usuário e banco PostgreSQL configurados"
else
    echo -e "  ${RED}✗${NC} Configuração PostgreSQL falhou"
fi

if [ "$UPDATE_ENV_OK" = true ]; then
    echo -e "  ${GREEN}✓${NC} Arquivo .env atualizado"
    echo -e "  ${GREEN}✓${NC} Conexão com banco testada"
else
    echo -e "  ${RED}✗${NC} Atualização .env/teste conexão falhou"
fi

# Informações da configuração
if [ "$UPDATE_ENV_OK" = true ]; then
    echo ""
    echo -e "${BLUE}Configurações aplicadas:${NC}"
    echo -e "  Banco: ${GREEN}pizzaria_db${NC}"
    echo -e "  Usuário: ${GREEN}pizzaria_user${NC}"
    echo -e "  Senha: ${GREEN}SenhaF0rte!${NC}"
    echo -e "  Host: ${GREEN}localhost:5432${NC}"
fi

# Erros encontrados
if [ ! -z "$ERRORS" ]; then
    echo ""
    echo -e "${RED}Erros encontrados:${NC}"
    echo -e "$ERRORS"
fi

# Status final
echo ""
echo -e "${BLUE}========================================${NC}"
if [ "$POSTGRES_OK" = true ] && [ "$UPDATE_ENV_OK" = true ]; then
    echo -e "${GREEN}✓ DEPLOY LOCAL CONCLUÍDO COM SUCESSO!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Próximos passos:${NC}"
    echo -e "  1. cd backend && npm install"
    echo -e "  2. npm run dev (para desenvolvimento)"
    echo -e "  3. Acessar: http://localhost:3001"
    exit 0
else
    echo -e "${RED}✗ DEPLOY LOCAL CONCLUÍDO COM ERROS${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Verifique os erros acima e tente novamente.${NC}"
    exit 1
fi

# Autor: Claude Code