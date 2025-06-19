# 🚀 Deploy com Docker - Sistema Pizzaria

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Mínimo 2GB RAM disponível
- 10GB espaço em disco

## 🏃 Quick Start

### Deploy Desenvolvimento
```bash
./deploy.sh dev
```

### Deploy Produção
```bash
# 1. Configurar variáveis de ambiente
cp .env.production .env.production.local
nano .env.production.local  # Editar senhas e URLs

# 2. Executar deploy
./deploy.sh prod
```

## 🔧 Configuração Detalhada

### 1. Variáveis de Ambiente Obrigatórias

Edite `.env.production` com suas configurações:

```env
# CRÍTICO - Altere estas senhas!
DB_PASSWORD=sua_senha_postgres_super_segura
JWT_SECRET=sua_chave_jwt_com_pelo_menos_64_caracteres_aleatórios

# URLs do sistema
FRONTEND_URL=https://seu-dominio.com.br
API_URL=https://seu-dominio.com.br/api
```

### 2. SSL/HTTPS (Produção)

Para HTTPS, coloque seus certificados em:
```
ssl/
├── cert.pem     # Certificado SSL
└── key.pem      # Chave privada
```

### 3. Estrutura dos Containers

```
pizzaria-postgres    :5432  → Banco PostgreSQL
pizzaria-backend     :3001  → API Node.js
pizzaria-frontend    :80    → Interface React/Nginx
pizzaria-redis       :6379  → Cache Redis
pizzaria-adminer     :8080  → Interface DB (dev only)
pizzaria-backup             → Backup automático (prod)
```

## 📝 Comandos Úteis

### Gerenciamento
```bash
# Iniciar desenvolvimento
./deploy.sh dev

# Iniciar produção
./deploy.sh prod

# Parar todos os serviços
./deploy.sh stop

# Ver logs
./deploy.sh logs              # Todos os serviços
./deploy.sh logs backend       # Apenas backend
./deploy.sh logs frontend      # Apenas frontend

# Backup manual
./deploy.sh backup
```

### Docker Compose Direto
```bash
# Status dos containers
docker-compose ps

# Reiniciar serviço específico
docker-compose restart backend

# Executar comando no container
docker-compose exec backend npm run migrate
docker-compose exec postgres psql -U postgres pizzaria_db

# Rebuild sem cache
docker-compose build --no-cache

# Limpar volumes (CUIDADO - apaga dados!)
docker-compose down -v
```

## 🔍 Verificação de Saúde

### 1. Verificar containers rodando
```bash
docker-compose ps
```

Todos devem estar "Up" e "healthy".

### 2. Testar endpoints
```bash
# Backend health check
curl http://localhost:3001/health

# Frontend
curl http://localhost

# Banco de dados
docker-compose exec postgres pg_isready
```

### 3. Verificar logs
```bash
# Logs do backend
docker-compose logs -f backend

# Últimas 50 linhas
docker-compose logs --tail=50 backend
```

## 🛠️ Troubleshooting

### Erro: "Docker daemon não está rodando"
```bash
# Linux
sudo systemctl start docker

# Windows/Mac
# Inicie o Docker Desktop
```

### Erro: "Port already allocated"
```bash
# Verificar portas em uso
sudo netstat -tulpn | grep -E ':(80|3001|5432|8080)'

# Matar processo usando a porta
sudo kill -9 $(sudo lsof -t -i:3001)
```

### Erro: "Cannot connect to database"
```bash
# Verificar se postgres está rodando
docker-compose ps postgres

# Ver logs do postgres
docker-compose logs postgres

# Testar conexão
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

### Erro de permissão nos volumes
```bash
# Linux - ajustar permissões
sudo chown -R $USER:$USER ./backend/uploads
sudo chown -R $USER:$USER ./backups
```

## 🔒 Segurança em Produção

1. **Senhas Fortes**: Sempre use senhas complexas em produção
2. **Firewall**: Configure firewall para permitir apenas portas necessárias
3. **HTTPS**: Use certificados SSL válidos
4. **Backups**: Configure backups automáticos regulares
5. **Monitoramento**: Implemente monitoramento de logs e métricas

## 📊 Monitoramento

### Logs em tempo real
```bash
# Todos os serviços
docker-compose logs -f

# Filtrar por serviço
docker-compose logs -f backend | grep ERROR
```

### Uso de recursos
```bash
# Ver uso de CPU/Memória
docker stats

# Específico do projeto
docker stats $(docker-compose ps -q)
```

### Espaço em disco
```bash
# Ver espaço usado pelo Docker
docker system df

# Limpar recursos não utilizados
docker system prune -a
```

## 🔄 Atualizações

### Atualizar código
```bash
# 1. Fazer pull das mudanças
git pull

# 2. Rebuild e restart
docker-compose build --no-cache
docker-compose up -d

# 3. Executar migrações se necessário
docker-compose exec backend npm run migrate
```

### Rollback
```bash
# Voltar para versão anterior
git checkout <commit-anterior>

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 💾 Backup e Restore

### Backup automático (produção)
Configurado para rodar diariamente às 3h da manhã.

### Backup manual
```bash
./deploy.sh backup
```

### Restore
```bash
# Listar backups disponíveis
ls -la backups/

# Restaurar backup específico
docker-compose exec -T postgres psql -U postgres pizzaria_db < backups/backup_20250615_120000.sql
```

## 📱 App Mobile (Deliverer App)

O app do entregador tem deploy separado. Consulte `deliverer-app/README.md`.

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs: `./deploy.sh logs`
2. Consulte a seção Troubleshooting
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Certifique-se que as portas não estão em uso

---

**Dica**: Para desenvolvimento local, use `./deploy.sh dev`. Para produção, sempre configure `.env.production` antes!