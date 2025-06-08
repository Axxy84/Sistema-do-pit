# 📋 GUIA COMPLETO DE INSTALAÇÃO DO BANCO PIZZARIA_DB

## 🚀 PASSO-A-PASSO PARA CRIAR O BANCO DO ZERO

### 1️⃣ PRÉ-REQUISITOS
- PostgreSQL instalado (versão 12 ou superior)
- Acesso como superusuário (postgres) ao servidor PostgreSQL
- Node.js instalado (para executar as migrações)

### 2️⃣ EXECUTAR O SCRIPT SQL COMPLETO

#### Opção A: Via psql (Recomendado)
```bash
# No servidor 192.168.0.105 ou onde o PostgreSQL está instalado
sudo -u postgres psql < /caminho/para/create-database-complete.sql

# Ou conectando remotamente
psql -h 192.168.0.105 -U postgres < create-database-complete.sql
```

#### Opção B: Executar partes separadamente
```bash
# 1. Conectar como superusuário
sudo -u postgres psql

# 2. Executar comandos de criação do banco e usuário
DROP DATABASE IF EXISTS pizzaria_db;
DROP USER IF EXISTS pizzaria_user;
CREATE USER pizzaria_user WITH PASSWORD 'nova_senha_123';
CREATE DATABASE pizzaria_db OWNER pizzaria_user;
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
\q

# 3. Conectar ao novo banco e executar o resto do script
psql -h localhost -U pizzaria_user -d pizzaria_db < create-database-complete.sql
```

### 3️⃣ EXECUTAR MIGRAÇÕES VIA NODE.JS

```bash
# Navegar para o diretório backend
cd backend

# Instalar dependências
npm install

# Configurar o .env (veja checklist abaixo)
cp .env.example .env
nano .env

# Executar as migrações
npm run migrate

# Inserir dados de teste (opcional)
psql -h 192.168.0.105 -U pizzaria_user -d pizzaria_db < scripts/insert-test-data.sql
```

### 4️⃣ VERIFICAR A INSTALAÇÃO

```bash
# Testar a conexão
node verify_password.js

# Ou usar o script de teste
node test-connection-enhanced.js
```

### 5️⃣ CRIAR USUÁRIO ADMIN NO SISTEMA

O script SQL já cria um usuário admin básico, mas você precisa gerar o hash correto da senha:

```bash
# Executar script para criar admin com senha hasheada
node scripts/create-admin.js
```

Ou manualmente via SQL:
```sql
-- Gerar hash com bcrypt e inserir
UPDATE usuarios 
SET senha = '$2a$10$XGqK.JG7XQwLKxZMGZvYyeF6Gg2hYqHbCONv8JXXnVFYGGzPN9Jxu' 
WHERE email = 'admin@pizzaria.com';
-- Essa senha é 'admin123'
```

## 📝 CHECKLIST DE CONFIGURAÇÃO DOS ARQUIVOS .ENV

### ✅ Arquivo `.env` (Desenvolvimento Local)

```env
# Configurações do Banco de Dados
DB_HOST=192.168.0.105
DB_PORT=5432
DB_USER=pizzaria_user
DB_PASSWORD=nova_senha_123  # ⚠️ ALTERAR!
DB_NAME=pizzaria_db

# Configurações da Aplicação
JWT_SECRET=sua_chave_secreta_muito_forte_aqui_change_me  # ⚠️ ALTERAR!
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Opcional - Para desenvolvimento
DEBUG=true
LOG_LEVEL=debug
```

### ✅ Arquivo `.env.production` (Produção)

```env
# Configurações do Banco de Dados
DB_HOST=seu_servidor_producao.com  # ⚠️ ALTERAR!
DB_PORT=5432
DB_USER=pizzaria_user_prod  # ⚠️ ALTERAR!
DB_PASSWORD=senha_super_segura_producao  # ⚠️ ALTERAR!
DB_NAME=pizzaria_db_prod

# Configurações da Aplicação
JWT_SECRET=chave_secreta_producao_muito_complexa_xyz123  # ⚠️ ALTERAR!
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=production

# CORS - Domínio de produção
CORS_ORIGIN=https://seu-dominio.com.br  # ⚠️ ALTERAR!

# Segurança
SECURE_COOKIES=true
TRUST_PROXY=true

# Opcional - Para produção
LOG_LEVEL=error
SENTRY_DSN=seu_sentry_dsn_aqui  # Para monitoramento de erros
```

## 🔒 CHECKLIST DE SEGURANÇA PÓS-INSTALAÇÃO

- [ ] **Alterar senha do usuário pizzaria_user** no PostgreSQL
- [ ] **Alterar senha do admin** no sistema (admin@pizzaria.com)
- [ ] **Gerar novo JWT_SECRET** único e complexo
- [ ] **Configurar firewall** para permitir apenas IPs autorizados
- [ ] **Habilitar SSL** no PostgreSQL para produção
- [ ] **Fazer backup** da configuração inicial
- [ ] **Testar todas as conexões** antes de ir para produção
- [ ] **Remover dados de teste** se foram inseridos
- [ ] **Configurar pg_hba.conf** para segurança adequada
- [ ] **Criar usuários específicos** para cada ambiente (dev, staging, prod)

## 🛠️ COMANDOS ÚTEIS

### Backup do banco
```bash
pg_dump -h 192.168.0.105 -U pizzaria_user -d pizzaria_db > backup_pizzaria_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
psql -h 192.168.0.105 -U pizzaria_user -d pizzaria_db < backup_pizzaria_20240101.sql
```

### Verificar tabelas criadas
```sql
\c pizzaria_db
\dt
```

### Verificar usuários e permissões
```sql
\du
\l
```

## ⚠️ TROUBLESHOOTING

### Erro: "password authentication failed"
1. Verifique se a senha está correta no .env
2. Confirme que o usuário existe: `\du` no psql
3. Verifique pg_hba.conf no servidor

### Erro: "database does not exist"
1. Execute a primeira parte do script como superusuário
2. Confirme criação: `\l` no psql

### Erro: "permission denied"
1. Execute: `GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;`
2. Execute: `GRANT ALL ON SCHEMA public TO pizzaria_user;`

### Erro: "could not connect to server"
1. Verifique se PostgreSQL está rodando
2. Confirme o IP e porta estão corretos
3. Verifique firewall e postgresql.conf (listen_addresses)

## 📞 SUPORTE

Em caso de problemas:
1. Verifique os logs: `tail -f /var/log/postgresql/*.log`
2. Execute o script de diagnóstico: `node test-connection-enhanced.js`
3. Consulte a documentação em `/backend/documentação.md`