# 🚀 Início Rápido - Sistema de Pizzaria PostgreSQL

## ⚡ Setup em 5 Minutos

### 1. Instalar PostgreSQL
```bash
# Windows: baixar do site oficial
# macOS: brew install postgresql
# Linux: sudo apt install postgresql
```

### 2. Criar banco de dados
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE pizzaria_db;
\q
```

### 3. Configurar Backend
```bash
cd backend
npm install

# Criar arquivo .env
echo "DB_HOST=localhost
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
JWT_SECRET=minha_chave_secreta_super_forte_12345
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173" > .env
```

### 4. Executar Migrações
```bash
npm run migrate
```

### 5. Iniciar Backend
```bash
npm run dev
```

### 6. Iniciar Frontend
```bash
cd ..
npm install
npm run dev
```

## 🎯 Primeiro Login

- **URL:** http://localhost:5173
- **Email:** admin@pizzaria.com
- **Senha:** admin123

⚠️ **Altere a senha após o primeiro login!**

## 🔧 Teste Rápido

### Verificar Backend
```bash
curl http://localhost:3001/api/health
```

### Verificar Autenticação
```bash
# Login
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pizzaria.com","password":"admin123"}'
```

## 📝 Próximos Passos

1. Faça login com as credenciais admin
2. Altere a senha do administrador
3. Teste a navegação entre as páginas
4. Implemente as funcionalidades específicas conforme necessário

## 🆘 Problemas Comuns

**PostgreSQL não conecta:**
- Verifique se está rodando: `pg_ctl status`
- Confirme senha no .env

**Frontend não carrega:**
- Verifique se backend está na porta 3001
- Confirme CORS_ORIGIN no .env

**Token inválido:**
- Limpe localStorage do navegador
- Faça novo login 