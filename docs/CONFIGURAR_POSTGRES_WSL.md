# 🔧 Configurar PostgreSQL WSL

## Status Atual
✅ PostgreSQL instalado e rodando no WSL
🔄 Precisa configurar banco de dados e usuário

## Comandos para Configuração

### 1. Acessar PostgreSQL como usuário do sistema
```bash
sudo -i -u postgres
```

### 2. Executar configuração
```bash
psql
```

### 3. Executar comandos SQL:
```sql
-- Criar banco de dados
CREATE DATABASE pizzaria_db;

-- Criar usuário específico
CREATE USER pizzaria_user WITH PASSWORD '8477';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;

-- Configurar senha do postgres também (opcional)
ALTER USER postgres PASSWORD '8477';

-- Sair
\q
```

### 4. Sair do usuário postgres
```bash
exit
```

### 5. Testar conexão
```bash
node test-db.cjs
```

## Configuração Atual (.env)
- `DB_HOST=localhost` ✅
- `DB_PORT=5432` ✅
- `DB_USER=pizzaria_user` ✅
- `DB_PASSWORD=8477` ✅
- `DB_NAME=pizzaria_db` ✅

## Se der erro de autenticação

Editar arquivo de configuração:
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Mudar linha:
```
# De:
local   all             all                                     peer

# Para:
local   all             all                                     md5
```

Reiniciar PostgreSQL:
```bash
sudo service postgresql restart
```

## Teste Final
Após configuração, execute:
```bash
node test-db.cjs
node verificar-integracao.js
```

**O PostgreSQL está funcionando! Só precisa configurar usuário e banco.** 🚀