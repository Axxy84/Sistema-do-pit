# 🐘 Instalação PostgreSQL no WSL

## Solução Recomendada
Instalar PostgreSQL diretamente no WSL evita problemas de rede entre WSL e Windows.

## Comandos de Instalação

### 1. Atualizar Pacotes
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Instalar PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
```

### 3. Iniciar Serviço
```bash
sudo service postgresql start
```

### 4. Verificar Status
```bash
sudo service postgresql status
```

### 5. Configurar Usuário PostgreSQL
```bash
# Mudar para usuário postgres
sudo -i -u postgres

# Acessar PostgreSQL
psql

# Criar banco e usuário
CREATE DATABASE pizzaria_db;
CREATE USER postgres WITH PASSWORD '8477';
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO postgres;

# Sair
\q
exit
```

### 6. Configurar Autenticação (Opcional)
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Alterar linha:
```
# De:
local   all             all                                     peer

# Para:
local   all             all                                     md5
```

### 7. Reiniciar PostgreSQL
```bash
sudo service postgresql restart
```

### 8. Testar Conexão
```bash
node test-db.cjs
```

## Configuração Atual
- `DB_HOST=localhost` (já configurado)
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_PASSWORD=8477`
- `DB_NAME=pizzaria_db`

## Vantagens do PostgreSQL no WSL
- ✅ Sem problemas de rede WSL ↔ Windows
- ✅ Configuração mais simples
- ✅ Performance melhor
- ✅ Controle total sobre o serviço

## Auto-inicialização (Opcional)
Para iniciar automaticamente:
```bash
echo 'sudo service postgresql start' >> ~/.bashrc
```

## Backup do Windows (Opcional)
Se quiser migrar dados do PostgreSQL Windows:
```bash
# No Windows (PowerShell)
pg_dump -h 192.168.0.101 -U postgres pizzaria_db > backup.sql

# No WSL
psql -U postgres pizzaria_db < backup.sql
```

**Após instalação, execute `node test-db.cjs` para testar!** 🚀