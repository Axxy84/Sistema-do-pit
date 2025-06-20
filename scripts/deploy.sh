#!/bin/bash

# Script de Deploy Manual - Sistema Pizzaria
# Uso: ./deploy.sh [start|stop|restart|migrate|backup]

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

# Verificar dependências
check_dependencies() {
    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado!"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm não está instalado!"
    fi
    
    if ! command -v psql &> /dev/null; then
        warning "PostgreSQL client não está instalado. Backup pode não funcionar."
    fi
}

# Iniciar serviços
start_services() {
    log "Iniciando serviços..."
    
    # Backend
    cd backend
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências do backend..."
        npm install
    fi
    
    log "Iniciando backend..."
    npm start &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    cd ..
    
    # Frontend
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências do frontend..."
        npm install
    fi
    
    log "Iniciando frontend..."
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    log "Serviços iniciados!"
    log "Frontend: http://localhost:5173"
    log "Backend: http://localhost:3001"
}

# Parar serviços
stop_services() {
    log "Parando serviços..."
    
    if [ -f backend.pid ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
    fi
    
    if [ -f frontend.pid ]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm frontend.pid
    fi
    
    # Parar processos node órfãos
    pkill -f "node.*backend" || true
    pkill -f "node.*vite" || true
    
    log "Serviços parados!"
}

# Reiniciar serviços
restart_services() {
    stop_services
    sleep 2
    start_services
}

# Executar migrações
run_migrations() {
    log "Executando migrações..."
    cd backend
    node scripts/migrate.js
    cd ..
    log "Migrações concluídas!"
}

# Backup manual
manual_backup() {
    log "Executando backup manual..."
    
    # Criar diretório de backup se não existir
    mkdir -p backups
    
    # Ler configurações do .env
    if [ -f "backend/.env" ]; then
        export $(cat backend/.env | grep -v '^#' | xargs)
    fi
    
    # Executar backup
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > "backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log "Backup salvo em: backups/"
}

# Menu principal
case "$1" in
    start)
        check_dependencies
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        check_dependencies
        restart_services
        ;;
    migrate)
        check_dependencies
        run_migrations
        ;;
    backup)
        check_dependencies
        manual_backup
        ;;
    *)
        echo "Sistema de Deploy Manual - Pizzaria"
        echo "Uso: $0 {start|stop|restart|migrate|backup}"
        echo ""
        echo "Comandos:"
        echo "  start   - Iniciar backend e frontend"
        echo "  stop    - Parar todos os serviços"
        echo "  restart - Reiniciar serviços"
        echo "  migrate - Executar migrações do banco"
        echo "  backup  - Executar backup manual do banco"
        echo ""
        echo "Exemplos:"
        echo "  $0 start"
        echo "  $0 stop"
        echo "  $0 backup"
        exit 1
        ;;
esac