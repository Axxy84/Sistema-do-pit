# Sistema de Pizzaria - PostgreSQL Local

Sistema completo de gestão de pizzaria com backend Node.js/Express e PostgreSQL local.

## 🚀 Configuração Inicial

### Pré-requisitos

1. **PostgreSQL** (versão 12 ou superior)
2. **Node.js** (versão 16 ou superior)
3. **npm** ou **yarn**

### 1. Instalação do PostgreSQL

#### Windows:
- Baixe e instale do site oficial: https://www.postgresql.org/download/windows/
- Durante a instalação, defina uma senha para o usuário `postgres`

#### macOS:
```bash
# Com Homebrew
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Configuração do Banco de Dados

```sql
-- Conecte ao PostgreSQL como superusuário e execute:
CREATE DATABASE pizzaria_db;
CREATE USER pizzaria_user WITH PASSWORD 'pizzaria_pass';
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;

-- Conecte ao banco pizzaria_db e execute:
\c pizzaria_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Configuração do Backend

```bash
cd backend
npm install

# Crie o arquivo .env com suas configurações:
cp config/env.js .env.example

# Edite o .env conforme sua configuração do PostgreSQL
```

**Arquivo .env (backend/.env):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
JWT_SECRET=uma_chave_secreta_muito_forte_aqui
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 4. Executar Migrações

```bash
cd backend
npm run migrate
```

Isso criará todas as tabelas necessárias e um usuário admin padrão:
- **Email:** admin@pizzaria.com
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere a senha do admin após o primeiro login!

### 5. Iniciar o Backend

```bash
cd backend
npm run dev  # Modo desenvolvimento
# ou
npm start    # Modo produção
```

O servidor estará rodando em `http://localhost:3001`

### 6. Configurar o Frontend

```bash
cd ..  # Voltar para a raiz do projeto
npm install  # Se ainda não foi instalado

# O frontend já está configurado para usar o backend local
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## 📝 Estrutura do Projeto

```
projeto/
├── backend/
│   ├── config/
│   │   ├── database.js      # Configuração PostgreSQL
│   │   └── env.js          # Variáveis de ambiente
│   │   
│   ├── middleware/
│   │   └── auth.js         # Middleware de autenticação JWT
│   │   
│   ├── routes/
│   │   ├── auth.js         # Rotas de autenticação
│   │   ├── users.js        # Gestão de usuários
│   │   ├── orders.js       # Gestão de pedidos
│   │   ├── products.js     # Gestão de produtos
│   │   └── ...
│   │   
│   ├── scripts/
│   │   └── migrate.js      # Scripts de migração
│   │   
│   ├── package.json
│   │   
│   └── server.js           # Servidor principal
│   
├── src/
│   ├── services/
│   │   └── authService.js  # Cliente HTTP para backend
│   │   
│   └── ...
│   
└── README.md
```

## 🔧 APIs Disponíveis

### Autenticação
- `POST /api/auth/signup` - Cadastro
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Dados do usuário atual
- `POST /api/auth/signout` - Logout
- `PATCH /api/auth/change-password` - Alterar senha

### Outras APIs (a serem implementadas)
- `/api/orders` - Gestão de pedidos
- `/api/products` - Gestão de produtos
- `/api/clients` - Gestão de clientes
- `/api/ingredients` - Gestão de ingredientes
- `/api/coupons` - Gestão de cupons
- `/api/dashboard` - Dados do dashboard

## 🔒 Segurança

- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Rate limiting nas requisições
- Validação de entrada de dados
- CORS configurado
- Headers de segurança com Helmet

## 🚀 Produção

Para produção, considere:
1. Usar PostgreSQL em servidor dedicado
2. Configurar HTTPS
3. Usar variáveis de ambiente seguras
4. Implementar logs estruturados
5. Configurar backup automático do banco
6. Usar PM2 ou similar para gerenciar processos Node.js

## 🆘 Solução de Problemas

### Erro de conexão com PostgreSQL
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo .env
3. Teste a conexão: `psql -h localhost -U postgres -d pizzaria_db`

### Erro "Token inválido"
1. Limpe o localStorage do navegador
2. Faça login novamente

### Portas em uso
- Backend: 3001
- Frontend: 5173
- PostgreSQL: 5432

Certifique-se de que essas portas estão livres.