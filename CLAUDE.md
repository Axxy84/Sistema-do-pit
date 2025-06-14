# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# language: pt-BR

## Project Overview

This is a complete restaurant/pizzeria management system (ERP) with:
- **Backend**: Node.js/Express with PostgreSQL database
- **Frontend**: React with Vite, TailwindCSS, and Radix UI components
- **Infrastructure**: PostgreSQL on neural server (192.168.0.105)

## Memories
- organize o layout ponha vermelho e preto que nem as outras paginas ✅ IMPLEMENTADO
- bordas não aparecem no frontend - resolver problema de dados ✅ RESOLVIDO 14/06/2025
- corrigir erros React whileTap e API 500 produtos ✅ RESOLVIDO 14/06/2025
- sistema de pedidos com erro 500 - colunas faltando no banco ✅ RESOLVIDO 14/06/2025
- autofill do browser não sincronizava com React state ✅ RESOLVIDO 14/06/2025
- telefone agora é opcional para criar clientes ✅ IMPLEMENTADO 14/06/2025
- erro 500 ao criar pedido mesa com múltiplos sabores ✅ RESOLVIDO 14/06/2025

## 🔥 Últimas Correções Críticas (Junho 2025)

### 🛠️ Problemas de Banco de Dados Resolvidos
**Data:** 14/06/2025
**Status:** ✅ RESOLVIDO COMPLETAMENTE

**Problemas identificados:**
- ❌ Senha do PostgreSQL incorreta (autenticação falhando)
- ❌ Tabelas do banco não existiam (migração não executada)
- ❌ Usuário postgres sem permissões adequadas
- ❌ Backend não conseguia conectar ao banco

**Soluções implementadas:**
1. **Senha PostgreSQL resetada**: `postgres` com senha `8477`
2. **Migração completa executada**: Todas as 12 tabelas criadas
3. **Usuário admin criado**: `admin@pizzaria.com` / `admin123`
4. **Servidor backend operacional**: Porta 3001 totalmente funcional

### 🎨 Layout Vermelho/Preto Implementado
**Status:** ✅ COMPLETAMENTE IMPLEMENTADO

**Componentes atualizados:**
- ✅ DashboardPage: Header vermelho/preto + gradiente de fundo
- ✅ Todas as páginas: Layout consistente vermelho/preto
- ✅ 4 novos gráficos dashboard adicionados:
  - `CumulativeAreaChart.jsx`: Área cumulativa de vendas
  - `MultiTrendChart.jsx`: Múltiplas tendências
  - `SalesComparisonChart.jsx`: Comparação de períodos  
  - `SalesHistogram.jsx`: Histograma de distribuição

### 🥖 Problema de Bordas Resolvido
**Data:** 14/06/2025 16:30
**Status:** ✅ RESOLVIDO COMPLETAMENTE

**Problema identificado:**
- ❌ Aba "Bordas" no frontend mostrava "0 itens" quando deveria mostrar 6 bordas
- ❌ Bordas existiam na tabela `bordas` mas frontend buscava na tabela `produtos`
- ❌ Constraint `produtos_tipo_produto_check` não incluía 'borda'

**Diagnóstico sistemático executado:**
1. ✅ **Backend API**: Endpoint `/api/bordas` funcionando (6 bordas disponíveis)  
2. ✅ **Frontend Components**: `RealBorderSelector` e `ProductsTable` configurados
3. ❌ **Root Cause**: Dois sistemas separados para bordas (tabela `bordas` vs `produtos`)

**Solução implementada:**
1. **Constraint atualizada**: Adicionado 'borda' ao check constraint de `produtos.tipo_produto`
2. **Migração de dados**: 6 bordas transferidas de `bordas` → `produtos` com `tipo_produto = 'borda'`
3. **Bordas migradas**: Beijinho (R$8), Brigadeiro (R$8), Doce de Leite (R$8), Goiabada (R$7), Nutella (R$10), Romeu e Julieta (R$10)

**Resultado final:**
- ✅ Aba "Bordas" agora mostra 6 itens ao invés de 0
- ✅ Badge amarelo "Borda Recheada" exibido corretamente
- ✅ Sistema unificado para gerenciamento de bordas

### 🐛 Erros Múltiplos de Frontend/Backend Resolvidos
**Data:** 14/06/2025 17:05
**Status:** ✅ RESOLVIDO COMPLETAMENTE

**Problemas identificados:**
- ❌ Erro 500 ao atualizar produto (ID: 114c0dfe-a025-4fc5-aeaf-fbf02c1646ac)
- ❌ React warning: prop `whileTap` não reconhecida em ProductTypeSelector  
- ❌ Failed to load resource para endpoint de produtos
- ❌ Import error: "framer-motion" não encontrado

**Diagnóstico sistemático executado:**
1. ✅ **Backend API**: Endpoint PUT funcionando, problema era autenticação JWT inválida
2. ✅ **React Props**: `div` comum não aceita props do Framer Motion
3. ✅ **Dependencies**: `framer-motion` não instalado no projeto
4. ✅ **Auth System**: Token válido gerado e testado

**Soluções implementadas:**
1. **Logs de debug**: Adicionados ao endpoint PUT `/products/:id` para rastreamento
2. **Token JWT válido**: Gerado token de teste funcional (24h)
3. **Substituição CSS**: `framer-motion` → TailwindCSS (`active:scale-95`)
4. **Teste completo**: Produto Nutella atualizado R$10→R$12 com sucesso

**Resultado final:**
- ✅ Erro 500: Eliminado (problema de autenticação)
- ✅ Warning React: Corrigido (motion.div → div + CSS)
- ✅ Import error: Resolvido (sem dependências extras)
- ✅ API funcionando: Update produtos 200 OK
- ✅ Animações preservadas: Efeito visual mantido com CSS puro

### 🆕 Sistema de Pedidos Restaurado (14/06/2025)
**Status:** ✅ TOTALMENTE FUNCIONAL

**Problemas resolvidos:**
1. **Erro 500 no GET /api/orders**: Colunas `tipo_pedido`, `numero_mesa` e `endereco_entrega` estavam faltando
2. **Motion.tr não definido**: Removida dependência do framer-motion não instalado
3. **POST /api/customers/manage 404**: Endpoint implementado com telefone opcional
4. **Autofill não sincronizava**: Sistema detecta e sincroniza autofill do browser com React state

**Soluções implementadas:**
- ✅ Script `fix-pedidos-missing-columns.js` adiciona colunas faltantes
- ✅ Detecção de autofill via CSS animation e sincronização periódica
- ✅ Fallback no submit captura valores direto do DOM
- ✅ Telefone agora opcional para criação de clientes

### 🍕 Pedidos de Mesa com Múltiplos Sabores Corrigido
**Data:** 14/06/2025 23:35
**Status:** ✅ RESOLVIDO COMPLETAMENTE

**Problema identificado:**
- ❌ Erro 500 ao criar pedido de mesa com múltiplos sabores
- ❌ Coluna `sabores_registrados` não existia na tabela `itens_pedido`
- ❌ Validação incorreta exigia endereço para pedidos de mesa

**Soluções implementadas:**
1. **Coluna adicionada**: `sabores_registrados` (JSONB) na tabela `itens_pedido`
2. **Validação corrigida**: Endereço só é obrigatório para delivery
3. **Valor padrão**: Número da mesa inicia com "1"
4. **Conversão garantida**: Número da mesa convertido para inteiro
5. **Logs de debug**: Adicionados para rastreamento de erros

**Esclarecimento importante:**
- Pedidos de mesa com status "entregue" são considerados fechados
- Para ver mesas em aberto no fechamento, o status deve ser diferente de "entregue" ou "cancelado"

### 🚀 Sistema 100% Operacional
**Verificado em:** 14/06/2025 23:35

- ✅ **PostgreSQL**: Conectado localhost:5432
- ✅ **Backend**: Rodando porta 3001
- ✅ **Frontend**: Interface vermelho/preto
- ✅ **Autenticação**: JWT funcional
- ✅ **APIs**: Todos endpoints testados
- ✅ **Cache**: Sistema otimizado ativo
- ✅ **Pedidos**: CRUD completo funcionando
- ✅ **Autofill**: Sincronização automática
- ✅ **Múltiplos sabores**: Funcionando para pedidos de mesa

**Credenciais de acesso:**
```bash
# PostgreSQL
Host: localhost:5432
User: postgres  
Password: 8477
Database: pizzaria_db

# Sistema
Email: admin@pizzaria.com
Senha: admin123
```

## Essential Commands

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Run migrations (creates tables and admin user)
npm run migrate

# Development server with hot reload
npm run dev

# Production server
npm start

# Kill port 3001 if needed
npm run kill-port

# Test database connection
node test-db.cjs

# Test specific endpoints
node test-products-api.js
node verificar-integracao.js
```

### Frontend Development
```bash
# From project root
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code (ESLint with React rules - console.log allowed)
npx eslint src/ --ext .js,.jsx,.ts,.tsx

# Lint fix (auto-fix issues)
npx eslint src/ --ext .js,.jsx,.ts,.tsx --fix
```

### Testing & Debugging
```bash
# Backend Tests (from backend/ directory)
node test-connection.js          # Test database connectivity
node test-db.cjs                 # Database connection validation
node test-products-api.js        # Products API endpoints
node verificar-integracao.js     # System integration test
node test-signup.js              # User registration test
node debug-jwt-backend.js        # JWT token debugging
node generate-test-token.js      # Generate test JWT tokens
node add_test_data.js            # Populate test data
node add-bebidas-exemplo.js      # Add example drinks
node check_data.js               # Validate data integrity

# Database Management & Debugging
node check-database-tables.js    # Verify table structure
node fix-database-structure.js   # Fix database issues
node check-constraints.js        # Check database constraints
node fix-constraints.js          # Fix constraint issues
node debug-cash-closing.js       # Debug cash closing issues
node debug-uuid-error.js         # Debug UUID-related errors

# Health Checks & Monitoring
./quick-health-check.sh          # System health check
./deploy_local.sh                # Local deployment check
node verificar-precos.js         # Price validation
node test-corrections.js         # Test system corrections

# Frontend Tests (from project root)
node test-multiple-flavors.cjs   # Multi-flavor pizza testing
node debug-jwt-frontend.js       # Frontend JWT debugging
node test-delivery-endpoints.cjs # Delivery API testing
node test-delivery-simple.cjs    # Simple delivery test
node test-orders-api.cjs         # Orders API testing
node test-post-order.cjs         # Order creation test

# Environment & Shell Scripts
./start-backend.bat              # Windows backend start
bash backend/dev-start.sh        # Linux/Mac backend start
bash backend/reset-db-password.sh # Reset database password
bash kill-port-3001.sh           # Kill backend port
```

### Database Setup
```sql
-- Initial setup (run as postgres user)
CREATE DATABASE pizzaria_db;
CREATE USER pizzaria_user WITH PASSWORD 'pizzaria_pass';
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;

-- Enable UUID extension
\c pizzaria_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Architecture Overview

### Backend Structure
- **Entry Point**: `backend/server.js` - Express server with security middlewares
- **Database**: `backend/config/database.js` - PostgreSQL connection pool
- **Authentication**: JWT-based with refresh tokens, middleware in `backend/middleware/auth.js`
- **Routes**: Modular route files in `backend/routes/`
- **Cache System**: In-memory cache-aside pattern in `backend/cache/`
- **Migrations**: Database setup scripts in `backend/scripts/migrate.js`
- **Special Routes**: Flutter delivery endpoints in `backend/routes/delivery-endpoints.js`

### Frontend Architecture
- **API Client**: `src/lib/apiClient.js` - Centralized HTTP client with auth handling
- **Services**: `src/services/` - Domain-specific API calls
- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route-level components in `src/pages/`
- **Context**: Auth context in `src/contexts/AuthContext.jsx`

### Key Features
1. **Authentication System**:
   - JWT with refresh tokens
   - Automatic token refresh on 401 responses
   - Protected routes on frontend

2. **Cache Implementation**:
   - Cache-aside pattern for heavy queries
   - TTL-based expiration
   - Automatic invalidation on data changes
   - Admin panel for cache management at `/api/cache-admin`

3. **Order Management**:
   - Complex order form with multiple payment methods
   - Pizza customization (sizes, borders, half/half)
   - Delivery fee calculation
   - Customer points system

4. **Dashboard Analytics**:
   - Real-time KPIs
   - Sales charts
   - Top products
   - Recent orders

## Database Schema Highlights

Key tables:
- `usuarios` - System users (employees)
- `clientes` - Customers
- `pedidos` - Orders with complex status workflow
- `itens_pedido` - Order items with pizza customization
- `produtos` - Products (pizzas, drinks, etc.)
- `fechamentos_caixa` - Cash closing records
- `transacoes` - Financial transactions

## Environment Configuration

Backend `.env` required variables:
```
DB_HOST=192.168.0.105
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=strong_secret_key
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Main Resources
- `/api/orders` - Order management
- `/api/products` - Product catalog
- `/api/customers` - Customer management
- `/api/dashboard` - Analytics data
- `/api/cash-closing` - Cash register operations
- `/api/reports` - Business reports
- `/api/deliverers` - Delivery personnel management
- `/api/delivery/*` - Flutter app endpoints for delivery drivers
- `/api/cache-admin` - Cache management panel
- `/api/owner` - Tony's analytics dashboard
- `/api/profit-calculator` - Profit analysis endpoints

## Development Workflows

### First-time Setup
1. `cd backend && npm install`
2. Configure `.env` file with database credentials
3. `npm run migrate` (creates tables and admin user)
4. `npm run dev` (starts backend on port 3001)
5. From project root: `npm install && npm run dev` (starts frontend on port 5173)

### Daily Development
1. `cd backend && npm run dev` (backend with hot reload)
2. `npm run dev` (frontend with Vite dev server)
3. Use test scripts to validate changes before committing

### Troubleshooting Workflow
1. Check backend health: `node backend/test-connection.js`
2. Verify API endpoints: `node backend/test-products-api.js`
3. Test system integration: `node backend/verificar-integracao.js`
4. If port issues: `npm run kill-port` or `bash kill-port-3001.sh`

## Development Notes

1. **CORS Configuration**: Backend accepts requests from any localhost port in development
2. **Cache Strategy**: Heavy queries are cached with appropriate TTLs (2-15 minutes)
3. **Error Handling**: API client automatically handles 401/403 and redirects to login
4. **Database Connection**: Uses connection pool with 20 max connections
5. **Security**: Helmet.js for security headers, rate limiting on sensitive endpoints
6. **Flutter Integration**: Ready-made endpoints for delivery app at `/api/delivery/*`
7. **Owner Dashboard**: Special analytics dashboard for Tony accessible via special login
8. **Multi-flavor Pizzas**: Complex pizza customization system with half/half support
9. **ESLint Configuration**: Console statements allowed in both frontend and backend
10. **Testing Strategy**: Extensive custom Node.js test scripts instead of formal test suites
11. **Hot Reload**: Backend uses `dev-start.sh` script for development with auto-restart

## Testing Credentials

Default admin user (created by migration):
- Email: `admin@pizzaria.com`
- Password: `admin123`

⚠️ Change this password immediately in production!

## Flutter Delivery App

System includes complete Flutter delivery app support:
- 5 dedicated endpoints in `/api/delivery/*`
- Ready for immediate Flutter integration
- Documentation in `FLUTTER_DELIVERY_APP.md`
- Test scripts: `test-delivery-endpoints.cjs`, `test-delivery-simple.cjs`

## Testing & Debugging

### Backend Testing Scripts
```bash
cd backend

# Database connection tests
node test-connection.js          # Full connection diagnostics
node test-db.cjs                # Simple connection test
node test-connection-enhanced.js # Enhanced diagnostics with troubleshooting

# API endpoint testing
node test-products-api.js        # Test products API with real data
node verificar-integracao.js     # Frontend-backend integration check
node test-corrections.js         # Test recent bug fixes and improvements
node test-organizacao.js         # Test system organization improvements
node test-final-correction.js    # Final correction validation

# Authentication & tokens
node generate-test-token.js      # Generate JWT tokens for testing
node test-signup.js              # Test user registration
node test-common-passwords.js    # Test password validation

# Data population & validation
node add_test_data.js            # Add test data to database
node populate-menu.js            # Populate complete menu
node populate-pitstop-menu.js    # Populate Pit Stop specific menu
node add-bebidas-exemplo.js      # Add example beverages

# Flutter/Delivery endpoints testing
node test-delivery-endpoints.cjs # Comprehensive delivery API test
node test-delivery-simple.cjs    # Simple delivery endpoint test
```

### Frontend Testing Scripts
```bash
# From project root

# Multi-flavor functionality test
node test-multiple-flavors.cjs   # Test multiple pizza flavors

# Order management tests
node test-orders-api.cjs         # Test orders API endpoints
node test-post-order.cjs         # Test order creation

# Debug scripts
node debug-jwt-frontend.js       # JWT token debugging for frontend
```

### Health Check Scripts
```bash
# System health verification
./quick-health-check.sh          # Complete system health check
./curl_test.sh                   # API connectivity test with curl

# Process management
./kill-port-3001.sh             # Kill processes on port 3001
./deploy_local.sh               # Local deployment script
```

### Database Management Scripts
```bash
cd backend

# Database structure
node check-database-tables.js   # Verify database tables exist
node check_tables.js            # Check table structure
node check_data.js              # Validate data integrity
node check-constraints.js       # Check database constraints

# Database fixes and migrations
node fix-database-structure.js  # Fix database structure issues
node fix-constraints.js         # Fix constraint problems
node migrate-product-types.js   # Migrate product types
node scripts/fix-missing-tables.js    # Fix missing tables
node scripts/fix-missing-columns.js   # Fix missing columns
node scripts/migrate-multiple-flavors.js # Migrate multi-flavor support

# Connection validation
node db-connection-validator.js # Validate database connections
node example-connection.js      # Example connection setup
```

### Specialized Debug Scripts
```bash
cd backend

# Cash closing debugging
node debug-cash-closing.js      # Debug cash closing issues

# JWT debugging  
node debug-jwt-backend.js       # Backend JWT debugging

# UUID error debugging
node debug-uuid-error.js        # Debug UUID-related errors

# Price verification
node verificar-precos.js        # Verify product pricing
```

### Shell Scripts for Environment
```bash
# Backend environment
cd backend
./dev-start.sh                  # Development server startup
./reset-db-password.sh          # Reset database password
./update_env.sh                 # Update environment variables
```

### Test Framework Support
The system includes Jest support in package.json but uses primarily custom Node.js test scripts for:
- Database connectivity validation
- API endpoint testing  
- Business logic verification
- Integration testing between frontend and backend
- Flutter delivery app endpoint testing

**Note**: No formal Jest test suites are currently implemented - the system relies on the comprehensive custom testing scripts above for validation and debugging.

## Key Business Logic

### Order Status Flow
- `pendente` → `preparando` → `saiu_para_entrega` → `entregue`
- Special handling for delivery orders with entregador assignment
- Complex payment methods (cash, card, pix, multiple payments)

### Product System
- Multi-size pizzas with different pricing per size
- Pizza borders (bordas) with additional costs
- Half/half pizza support with flavor combinations
- Product types: pizza, bebida, lanche, sobremesa, outros

### Cash Closing System
- Daily cash register closing with transaction reconciliation
- Payment method breakdown
- Expense tracking integration
- Historical closing records

## Common Issues & Solutions

### Database Connection Issues
```bash
# Test database connectivity
node backend/test-connection.js
node backend/test-db.cjs

# Check database tables and structure
node backend/check-database-tables.js
node backend/check-constraints.js
```

### JWT/Authentication Issues
```bash
# Debug JWT tokens (backend)
node backend/debug-jwt-backend.js

# Debug JWT tokens (frontend)
node debug-jwt-frontend.js

# Generate test tokens
node backend/generate-test-token.js
```

### Port Conflicts
```bash
# Kill backend port if stuck
npm run kill-port                    # from backend/
bash kill-port-3001.sh              # from project root

# Check what's using port 3001
lsof -i :3001
```

### Cash Closing Issues
```bash
# Debug cash closing problems
node backend/debug-cash-closing.js

# Check transaction data
node backend/check_data.js
```

### UUID Errors
```bash
# Debug UUID-related issues
node backend/debug-uuid-error.js
node debug-uuid-error.cjs
```