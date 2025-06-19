#!/bin/bash

# Script de Deploy - Sistema Pizzaria
# Uso: ./deploy.sh [dev|prod|stop|logs|backup]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado!"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado!"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon não está rodando!"
    fi
}

# Deploy desenvolvimento
deploy_dev() {
    log "Iniciando deploy em modo DESENVOLVIMENTO..."
    
    # Criar network se não existir
    docker network create pizzaria-network 2>/dev/null || true
    
    # Build e start com profile dev (inclui adminer)
    docker-compose --profile dev up -d --build
    
    log "Aguardando serviços iniciarem..."
    sleep 10
    
    # Verificar saúde dos serviços
    docker-compose ps
    
    log "Deploy desenvolvimento concluído!"
    log "Frontend: http://localhost"
    log "Backend: http://localhost:3001"
    log "Adminer: http://localhost:8080"
}

# Deploy produção
deploy_prod() {
    log "Iniciando deploy em modo PRODUÇÃO..."
    
    # Verificar arquivo de ambiente
    if [ ! -f ".env.production" ]; then
        error "Arquivo .env.production não encontrado!"
    fi
    
    # Carregar variáveis de produção
    set -a
    source .env.production
    set +a
    
    # Validar variáveis críticas
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "sua_chave_jwt_super_segura_aqui_com_64_caracteres_pelo_menos!!" ]; then
        error "JWT_SECRET não foi configurado em .env.production!"
    fi
    
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" == "senha_super_segura_aqui_123!@#" ]; then
        error "DB_PASSWORD não foi configurado em .env.production!"
    fi
    
    # Build das imagens
    log "Construindo imagens Docker..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
    
    # Deploy com configurações de produção
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    log "Aguardando serviços iniciarem..."
    sleep 15
    
    # Executar migrações
    log "Executando migrações do banco de dados..."
    docker-compose exec backend npm run migrate
    
    # Verificar saúde dos serviços
    docker-compose ps
    
    log "Deploy produção concluído!"
    log "Sistema disponível em: ${FRONTEND_URL:-http://localhost}"
}

# Parar serviços
stop_services() {
    log "Parando todos os serviços..."
    docker-compose down
    log "Serviços parados!"
}

# Ver logs
show_logs() {
    service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f --tail=100
    else
        docker-compose logs -f --tail=100 $service
    fi
}

# Backup manual
manual_backup() {
    log "Executando backup manual..."
    
    # Criar diretório de backup se não existir
    mkdir -p backups
    
    # Executar backup
    docker-compose exec postgres pg_dump -U postgres pizzaria_db > "backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log "Backup salvo em: backups/"
}

# Menu principal
case "$1" in
    dev)
        check_docker
        deploy_dev
        ;;
    prod)
        check_docker
        deploy_prod
        ;;
    stop)
        check_docker
        stop_services
        ;;
    logs)
        check_docker
        show_logs $2
        ;;
    backup)
        check_docker
        manual_backup
        ;;
    *)
        echo "Sistema de Deploy - Pizzaria"
        echo "Uso: $0 {dev|prod|stop|logs|backup}"
        echo ""
        echo "Comandos:"
        echo "  dev     - Deploy em modo desenvolvimento (com Adminer)"
        echo "  prod    - Deploy em modo produção"
        echo "  stop    - Parar todos os serviços"
        echo "  logs    - Ver logs dos serviços (opcional: nome do serviço)"
        echo "  backup  - Executar backup manual do banco"
        echo ""
        echo "Exemplos:"
        echo "  $0 dev"
        echo "  $0 prod"
        echo "  $0 logs backend"
        echo "  $0 backup"
        exit 1
        ;;
esac