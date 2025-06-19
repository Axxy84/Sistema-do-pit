# 📦 Guia de Instalação Docker - Sistema Pizzaria

## 🔧 Instalação do Docker

### Windows (WSL2)
```bash
# 1. Baixar Docker Desktop
# Acesse: https://www.docker.com/products/docker-desktop/
# Baixe e instale o Docker Desktop for Windows

# 2. Após instalar, abra o PowerShell como Admin:
wsl --set-default-version 2

# 3. Reinicie o computador

# 4. Verifique a instalação:
docker --version
docker-compose --version
```

### Ubuntu/Debian
```bash
# 1. Atualizar pacotes
sudo apt update
sudo apt upgrade -y

# 2. Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 3. Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. Adicionar repositório Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# 7. Verificar instalação
docker --version
docker compose version
```

### CentOS/RHEL/Fedora
```bash
# 1. Remover versões antigas
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 2. Instalar dependências
sudo yum install -y yum-utils

# 3. Adicionar repositório
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 4. Instalar Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 5. Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# 6. Adicionar usuário ao grupo
sudo usermod -aG docker $USER
newgrp docker
```

## 🚀 Instalação do Sistema

### 1. Clonar o repositório (se ainda não tiver)
```bash
git clone https://github.com/seu-usuario/sistema-pizzaria.git
cd sistema-pizzaria
```

### 2. Configurar ambiente
```bash
# Copiar arquivo de exemplo
cp .env.production .env

# Editar configurações (IMPORTANTE!)
nano .env
```

**Edite as seguintes variáveis:**
```env
# ALTERE ESTAS SENHAS!
DB_PASSWORD=coloque_uma_senha_forte_aqui
JWT_SECRET=gere_uma_string_aleatoria_de_64_caracteres_aqui

# Se for acessar externamente:
FRONTEND_URL=http://seu-ip-ou-dominio
API_URL=http://seu-ip-ou-dominio/api
```

### 3. Dar permissão ao script
```bash
chmod +x deploy.sh
```

### 4. Executar instalação

#### Opção A: Desenvolvimento (com interface de banco)
```bash
./deploy.sh dev
```

#### Opção B: Produção
```bash
./deploy.sh prod
```

### 5. Aguardar instalação
O processo pode demorar 5-10 minutos na primeira vez, pois irá:
- Baixar imagens base
- Instalar dependências
- Construir aplicação
- Iniciar banco de dados
- Executar migrações

## ✅ Verificar instalação

### 1. Verificar containers rodando
```bash
docker ps
```

Você deve ver algo assim:
```
CONTAINER ID   IMAGE               STATUS      PORTS
xxx            pizzaria-frontend   Up          0.0.0.0:80->80/tcp
xxx            pizzaria-backend    Up          3001/tcp
xxx            pizzaria-postgres   Up          0.0.0.0:5432->5432/tcp
xxx            pizzaria-redis      Up          6379/tcp
```

### 2. Testar acesso
```bash
# Testar backend
curl http://localhost:3001/health

# Ou abra no navegador:
# Frontend: http://localhost
# Backend: http://localhost:3001
# Adminer (dev): http://localhost:8080
```

### 3. Login no sistema
```
Email: admin@pizzaria.com
Senha: admin123
```

## 🛠️ Comandos úteis pós-instalação

### Ver logs
```bash
# Todos os logs
./deploy.sh logs

# Logs específicos
./deploy.sh logs backend
./deploy.sh logs frontend
```

### Parar sistema
```bash
./deploy.sh stop
```

### Reiniciar
```bash
docker-compose restart
```

### Backup do banco
```bash
./deploy.sh backup
```

## ❌ Problemas comuns

### "Cannot connect to Docker daemon"
```bash
# Linux: Iniciar Docker
sudo systemctl start docker

# Windows: Abrir Docker Desktop
```

### "Permission denied"
```bash
# Linux: Adicionar ao grupo docker
sudo usermod -aG docker $USER
# Fazer logout e login novamente
```

### "Port already allocated"
```bash
# Ver o que está usando a porta 80
sudo lsof -i :80

# Matar o processo (cuidado!)
sudo kill -9 [PID]

# Ou mudar a porta no docker-compose.yml
# De: "80:80"
# Para: "8080:80"
```

### "Out of disk space"
```bash
# Limpar imagens não usadas
docker system prune -a

# Ver espaço usado
docker system df
```

## 📱 Próximos passos

1. **Mudar senha admin**: Faça login e altere a senha padrão
2. **Configurar backups**: Verifique se os backups automáticos estão funcionando
3. **SSL/HTTPS**: Configure certificados para produção
4. **Firewall**: Configure as regras de firewall necessárias

## 🆘 Precisa de ajuda?

1. Verifique os logs: `./deploy.sh logs`
2. Consulte a documentação: `DEPLOY_DOCKER.md`
3. Verifique se Docker está rodando: `docker info`

---

**Instalação rápida em 3 comandos:**
```bash
chmod +x deploy.sh
cp .env.production .env
./deploy.sh dev
```

Sistema estará disponível em: http://localhost 🎉