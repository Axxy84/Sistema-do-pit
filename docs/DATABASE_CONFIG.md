# 🗄️ Configuração do Banco de Dados - Sistema Pizzaria

## 📋 Informações de Conexão

### 🐘 PostgreSQL
- **Host:** `192.168.0.105` (Servidor neural)
- **Porta:** `5432`
- **Nome do Banco:** `pizzaria_db`
- **Usuário:** `thiago`
- **Senha:** `senha123`

### 🔧 Variáveis de Ambiente (.env)
```bash
DB_HOST=192.168.0.105
DB_PORT=5432
DB_USER=thiago
DB_PASSWORD=senha123
DB_NAME=pizzaria_db
```

## 🏗️ Estrutura do Banco

### 📊 Tabelas Principais
- `users` - Usuários do sistema
- `profiles` - Perfis de usuários
- `pedidos` - Pedidos da pizzaria
- `clientes` - Clientes cadastrados
- `produtos` - Produtos/pizzas
- `entregadores` - Entregadores
- `cupons` - Cupons de desconto
- `fechamento_caixa` - Fechamentos diários
- `configuracoes` - Configurações do sistema

### 🔍 Detalhes da Tabela Pedidos
Após correções implementadas, a tabela `pedidos` contém:
- `id` (UUID, PK)
- `cliente_id` (UUID, FK)
- `status_pedido` (VARCHAR, default: 'pendente')
- `total` (NUMERIC)
- `forma_pagamento` (VARCHAR)
- `data_pedido` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `taxa_entrega` (NUMERIC, default: 0.00)
- `entregador_nome` (VARCHAR)
- `multiplos_pagamentos` (BOOLEAN, default: false)
- `cupom_id` (UUID, FK)
- `desconto_aplicado` (NUMERIC, default: 0)
- `pontos_ganhos` (INTEGER, default: 0)
- `pontos_resgatados` (INTEGER, default: 0)
- `tipo_pedido` (VARCHAR(50), default: 'balcao') ✨ **ADICIONADO**
- `numero_mesa` (INTEGER, NULL) ✨ **ADICIONADO**
- `endereco_entrega` (TEXT, NULL) ✨ **ADICIONADO**
- `observacoes` (TEXT, NULL) ✨ **ADICIONADO**
- `tempo_preparo` (INTEGER, NULL) ✨ **ADICIONADO**
- `status` (VARCHAR(50), default: 'pendente') ✨ **ADICIONADO**

## 👤 Usuários Padrão

### Admin Principal
- **Email:** `admin@pizzaria.com`
- **Senha:** `admin123`
- **Tipo:** `admin`
- **Acesso:** Completo ao sistema

## 🔐 Segurança

### JWT Configuration
- **Secret:** `sua_chave_secreta_muito_forte_aqui_change_me`
- **Expiração:** `7d` (7 dias)

## 🌐 Configurações de Rede

### CORS Origins
- `http://192.168.0.105:5173` (Rede local)
- `http://localhost:5173` (Desenvolvimento local)

### Backend
- **Porta:** `3001`
- **Ambiente:** `development`

## 📝 Histórico de Correções

### Versão Atual (10/06/2025)
- ✅ Corrigidos erros 500 na API /orders
- ✅ Adicionadas colunas faltantes na tabela pedidos
- ✅ Scripts de migração automática criados
- ✅ Validação completa da estrutura do banco

### Scripts de Migração Disponíveis
- `check-pedidos-table.cjs` - Diagnóstico da tabela
- `fix-all-missing-columns.cjs` - Migração completa
- `test-orders-api.cjs` - Teste da API

## 🚀 Como Conectar

### Via Node.js
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'thiago',
  host: '192.168.0.105',
  database: 'pizzaria_db',
  password: 'senha123',
  port: 5432,
});
```

### Via Terminal (se psql estiver instalado)
```bash
psql -h 192.168.0.105 -U thiago -d pizzaria_db
```

## ⚠️ Observações Importantes
1. O banco está em servidor remoto (192.168.0.105)
2. Credenciais são para ambiente de desenvolvimento
3. Scripts de migração são seguros e verificam antes de alterar
4. Backup automático mantido em `.env.backup`

---
**Última atualização:** 10/06/2025  
**Status:** ✅ Operacional e testado 