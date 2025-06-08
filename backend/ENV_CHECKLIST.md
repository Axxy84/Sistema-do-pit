# ✅ CHECKLIST DE CONFIGURAÇÃO .ENV

## 📁 ARQUIVO: `.env` (Desenvolvimento Local)

### Configurações Obrigatórias do Banco de Dados
- [ ] `DB_HOST` = IP do servidor PostgreSQL (ex: 192.168.0.105)
- [ ] `DB_PORT` = Porta do PostgreSQL (padrão: 5432)
- [ ] `DB_USER` = Usuário do banco (ex: pizzaria_user)
- [ ] `DB_PASSWORD` = **⚠️ ALTERAR!** Senha do usuário do banco
- [ ] `DB_NAME` = Nome do banco (ex: pizzaria_db)

### Configurações de Segurança
- [ ] `JWT_SECRET` = **⚠️ GERAR NOVA!** Chave secreta para tokens (mínimo 32 caracteres)
- [ ] `JWT_EXPIRES_IN` = Tempo de expiração do token (ex: 7d, 24h)

### Configurações do Servidor
- [ ] `PORT` = Porta da API (padrão: 3001)
- [ ] `NODE_ENV` = development
- [ ] `CORS_ORIGIN` = http://localhost:5173 (ou sua porta do frontend)

### Exemplo .env Completo
```env
# Banco de Dados
DB_HOST=192.168.0.105
DB_PORT=5432
DB_USER=pizzaria_user
DB_PASSWORD=ALTERAR_ESTA_SENHA
DB_NAME=pizzaria_db

# Segurança
JWT_SECRET=GERAR_CHAVE_SEGURA_COM_32_CARACTERES_OU_MAIS
JWT_EXPIRES_IN=7d

# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## 📁 ARQUIVO: `.env.production` (Produção)

### Configurações Obrigatórias do Banco de Dados
- [ ] `DB_HOST` = **⚠️ ALTERAR!** IP/domínio do servidor de produção
- [ ] `DB_PORT` = Porta do PostgreSQL (padrão: 5432)
- [ ] `DB_USER` = **⚠️ ALTERAR!** Usuário específico para produção
- [ ] `DB_PASSWORD` = **⚠️ ALTERAR!** Senha forte e única
- [ ] `DB_NAME` = Nome do banco de produção

### Configurações de Segurança
- [ ] `JWT_SECRET` = **⚠️ GERAR NOVA!** Chave única para produção (64+ caracteres)
- [ ] `JWT_EXPIRES_IN` = Tempo reduzido para produção (ex: 24h, 12h)
- [ ] `SECURE_COOKIES` = true
- [ ] `TRUST_PROXY` = true (se estiver atrás de proxy/nginx)

### Configurações do Servidor
- [ ] `PORT` = Porta da API em produção
- [ ] `NODE_ENV` = production
- [ ] `CORS_ORIGIN` = **⚠️ ALTERAR!** https://seu-dominio.com.br

### Configurações Opcionais de Produção
- [ ] `LOG_LEVEL` = error (reduz logs em produção)
- [ ] `SENTRY_DSN` = URL do Sentry para monitoramento
- [ ] `DATABASE_SSL` = true (se usar SSL no PostgreSQL)
- [ ] `RATE_LIMIT` = 100 (limite de requisições por IP)

### Exemplo .env.production Completo
```env
# Banco de Dados - PRODUÇÃO
DB_HOST=servidor-producao.com
DB_PORT=5432
DB_USER=pizzaria_prod_user
DB_PASSWORD=SENHA_SUPER_FORTE_PRODUCAO_2024
DB_NAME=pizzaria_db_prod

# Segurança - PRODUÇÃO
JWT_SECRET=CHAVE_COMPLEXA_64_CARACTERES_UNICA_PARA_PRODUCAO_XYZ789
JWT_EXPIRES_IN=24h
SECURE_COOKIES=true
TRUST_PROXY=true

# Servidor - PRODUÇÃO
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://pizzaria.com.br

# Monitoramento e Performance
LOG_LEVEL=error
SENTRY_DSN=https://seu_dsn@sentry.io/projeto
DATABASE_SSL=true
RATE_LIMIT=100
```

---

## 🔐 GERADOR DE CHAVES SEGURAS

### Para gerar JWT_SECRET seguro:

#### Opção 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Opção 2: OpenSSL
```bash
openssl rand -hex 64
```

#### Opção 3: Online (apenas para desenvolvimento)
```bash
# NÃO use geradores online para produção!
# Use apenas os comandos acima
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO FINAL

### Antes de Iniciar o Sistema
- [ ] Arquivo `.env` existe no diretório `/backend`
- [ ] Todas as variáveis obrigatórias estão preenchidas
- [ ] Senhas foram alteradas dos valores padrão
- [ ] JWT_SECRET foi gerado com segurança
- [ ] Testou conexão: `node verify_password.js`

### Antes de Ir para Produção
- [ ] Criou `.env.production` com valores únicos
- [ ] Todas as senhas são diferentes de desenvolvimento
- [ ] JWT_SECRET de produção é diferente e mais forte
- [ ] CORS_ORIGIN aponta para domínio correto
- [ ] NODE_ENV está como "production"
- [ ] Removeu valores de debug/desenvolvimento
- [ ] Configurou SSL se necessário
- [ ] Testou em ambiente de staging primeiro

### Segurança do .env
- [ ] Arquivo `.env` está no `.gitignore`
- [ ] Nunca commitar `.env` no Git
- [ ] Backup seguro das credenciais
- [ ] Acesso restrito aos arquivos no servidor
- [ ] Permissões: `chmod 600 .env`
- [ ] Proprietário correto: `chown app_user .env`

---

## ⚠️ AVISOS IMPORTANTES

1. **NUNCA** use as senhas padrão em produção
2. **NUNCA** commite arquivos `.env` no Git
3. **SEMPRE** gere novos JWT_SECRET para cada ambiente
4. **SEMPRE** use HTTPS em produção
5. **SEMPRE** faça backup das configurações

## 🆘 PROBLEMAS COMUNS

### "Cannot find module 'dotenv'"
```bash
cd backend && npm install
```

### "ECONNREFUSED" ao conectar
- Verifique se todas as variáveis DB_* estão corretas
- Confirme que o PostgreSQL está acessível

### "Invalid token" após deploy
- JWT_SECRET diferente entre ambientes
- Limpe cookies/localStorage e faça login novamente