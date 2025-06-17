# 📱 APIs dos Aplicativos Premium - Documentação Completa

## 🎯 **Visão Geral**

Este documento apresenta as **3 APIs completas** desenvolvidas para os aplicativos premium do sistema de pizzaria, prontas para implementação por agentes automatizados.

### **Arquitetura do Sistema**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Garçom    │    │  App Entregador │    │    App Dono     │
│   (Premium)     │    │   (Premium)     │    │   (Premium)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Backend APIs   │
                    │   Centralizado  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    └─────────────────┘
```

---

## 📱 **API 1: APP DO GARÇOM**

### **Funcionalidades Implementadas**
- ✅ **Gestão de Mesas**: Visualização de status em tempo real (livre/ocupada/reservada)
- ✅ **Criação de Pedidos**: Sistema completo com múltiplos sabores e bordas
- ✅ **Controle de Status**: Acompanhamento do fluxo do pedido (pendente → preparando → pronto → retirado)
- ✅ **Fechamento de Contas**: Múltiplas formas de pagamento e descontos
- ✅ **Cardápio Dinâmico**: Produtos organizados por categoria
- ✅ **Notificações**: Alertas de pedidos prontos e em atraso

### **Endpoints da API**

#### **Autenticação**
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "garcom@pizzaria.com",
  "senha": "senha123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "nome": "João Garçom",
    "tipo_usuario": "garcom"
  }
}
```

#### **Gestão de Mesas**
```http
GET /api/waiter/tables
Authorization: Bearer {token}

Response:
{
  "tables": [
    {
      "numero_mesa": 1,
      "status": "ocupada",
      "pedidos_ativos": 2,
      "valor_conta": 85.50,
      "tempo_ocupacao": "45 min"
    }
  ]
}
```

#### **Pedidos de Mesa Específica**
```http
GET /api/waiter/table/5/orders
Authorization: Bearer {token}

Response:
{
  "orders": [
    {
      "id": "pedido-uuid",
      "status_pedido": "preparando",
      "valor_total": 65.90,
      "data_pedido": "2024-01-15T14:30:00Z",
      "itens": [
        {
          "produto_nome": "Pizza Margherita",
          "quantidade": 1,
          "preco_unitario": 42.90,
          "observacoes": "Sem cebola",
          "sabores": ["Margherita"],
          "borda": "Catupiry"
        }
      ]
    }
  ]
}
```

#### **Criar Novo Pedido**
```http
POST /api/waiter/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "numero_mesa": 5,
  "cliente_nome": "Mesa 5",
  "itens": [
    {
      "produto_id": "pizza-uuid",
      "quantidade": 1,
      "observacoes": "Sem cebola",
      "sabores": ["Margherita", "Pepperoni"],
      "borda": "catupiry-uuid"
    }
  ],
  "observacoes_gerais": "Cliente VIP"
}

Response:
{
  "message": "Pedido criado com sucesso",
  "order": {
    "id": "pedido-uuid",
    "valor_total": 65.90,
    "status_pedido": "pendente"
  }
}
```

#### **Atualizar Status do Pedido**
```http
PATCH /api/waiter/orders/{orderId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "retirado"
}

Response:
{
  "message": "Status atualizado com sucesso",
  "order": {
    "id": "pedido-uuid",
    "status_pedido": "retirado"
  }
}
```

#### **Fechar Conta da Mesa**
```http
POST /api/waiter/table/5/close
Authorization: Bearer {token}
Content-Type: application/json

{
  "forma_pagamento": "cartao",
  "valor_pago": 85.50,
  "desconto": 5.00
}

Response:
{
  "message": "Mesa fechada com sucesso",
  "tableNumber": 5,
  "valor_total": 90.50,
  "valor_final": 85.50,
  "forma_pagamento": "cartao"
}
```

#### **Cardápio**
```http
GET /api/waiter/menu
Authorization: Bearer {token}

Response:
{
  "menu": {
    "pizza": [
      {
        "id": "pizza-uuid",
        "nome": "Pizza Margherita",
        "preco": 42.90,
        "tamanhos_disponiveis": ["P", "M", "G"],
        "categoria": "tradicional"
      }
    ],
    "borda": [
      {
        "id": "borda-uuid",
        "nome": "Catupiry",
        "preco": 8.00
      }
    ]
  }
}
```

#### **Notificações**
```http
GET /api/waiter/notifications
Authorization: Bearer {token}

Response:
{
  "notifications": [
    {
      "id": "pedido-uuid",
      "type": "ready",
      "message": "Mesa 5 - Pedido pronto para retirada",
      "tableNumber": 5,
      "priority": "high",
      "timestamp": "2024-01-15T14:45:00Z"
    }
  ]
}
```

### **Fluxo de Trabalho do Garçom**
1. **Login** → Autenticação específica para garçom
2. **Visualizar Mesas** → Status em tempo real
3. **Selecionar Mesa** → Ver pedidos ativos
4. **Criar Pedido** → Adicionar itens, sabores, bordas
5. **Acompanhar Status** → Pendente → Preparando → Pronto → Retirado
6. **Fechar Conta** → Múltiplas formas de pagamento

---

## 🚚 **API 2: APP DO ENTREGADOR**

### **Funcionalidades Implementadas**
- ✅ **Perfil do Entregador**: Estatísticas e informações pessoais
- ✅ **Status de Disponibilidade**: Disponível/Ocupado/Offline
- ✅ **Entregas Disponíveis**: Lista de pedidos prontos para entrega
- ✅ **Sistema de Aceitar/Rejeitar**: Aceitar entregas disponíveis
- ✅ **Tracking de Localização**: GPS em tempo real
- ✅ **Finalização de Entregas**: Comprovantes e comissões
- ✅ **Estatísticas Pessoais**: Performance e ganhos

### **Endpoints da API**

#### **Perfil do Entregador**
```http
GET /api/deliverer/profile
Authorization: Bearer {token}

Response:
{
  "profile": {
    "id": "entregador-uuid",
    "nome": "Carlos Entregador",
    "telefone": "(11) 99999-9999",
    "veiculo": "Moto Honda",
    "status": "disponivel",
    "entregas_hoje": 8,
    "valor_comissao_hoje": 84.00
  }
}
```

#### **Atualizar Status**
```http
PATCH /api/deliverer/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "disponivel",
  "latitude": -23.5505,
  "longitude": -46.6333
}

Response:
{
  "message": "Status atualizado com sucesso",
  "status": "disponivel",
  "timestamp": "2024-01-15T15:00:00Z"
}
```

#### **Listar Entregas Disponíveis**
```http
GET /api/deliverer/deliveries?status=pronto
Authorization: Bearer {token}

Response:
{
  "deliveries": [
    {
      "id": "pedido-uuid",
      "cliente_nome": "Maria Silva",
      "cliente_telefone": "(11) 88888-8888",
      "endereco": "Rua das Flores, 123",
      "valor_total": 65.90,
      "taxa_entrega": 8.00,
      "status_pedido": "pronto",
      "tempo_estimado": 25,
      "priority": "medium",
      "itens": [
        {
          "produto_nome": "Pizza Calabresa",
          "quantidade": 1,
          "observacoes": "Bem passada"
        }
      ]
    }
  ]
}
```

#### **Aceitar Entrega**
```http
POST /api/deliverer/deliveries/{orderId}/accept
Authorization: Bearer {token}

Response:
{
  "message": "Entrega aceita com sucesso",
  "orderId": "pedido-uuid",
  "status": "accepted"
}
```

#### **Iniciar Entrega**
```http
POST /api/deliverer/deliveries/{orderId}/start
Authorization: Bearer {token}

Response:
{
  "message": "Entrega iniciada com sucesso",
  "order": {
    "id": "pedido-uuid",
    "status_pedido": "saiu_para_entrega",
    "data_saida_entrega": "2024-01-15T15:30:00Z"
  }
}
```

#### **Finalizar Entrega**
```http
POST /api/deliverer/deliveries/{orderId}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "valor_recebido": 65.90,
  "forma_pagamento": "dinheiro",
  "observacoes": "Entrega realizada com sucesso",
  "foto_comprovante": "base64_string_optional"
}

Response:
{
  "message": "Entrega finalizada com sucesso",
  "orderId": "pedido-uuid",
  "valor_recebido": 65.90,
  "comissao": 5.60,
  "status": "completed"
}
```

#### **Atualizar Localização GPS**
```http
POST /api/deliverer/location
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 10,
  "speed": 25
}

Response:
{
  "message": "Localização atualizada com sucesso",
  "timestamp": "2024-01-15T15:35:00Z"
}
```

#### **Estatísticas do Entregador**
```http
GET /api/deliverer/stats?period=today
Authorization: Bearer {token}

Response:
{
  "stats": {
    "total_entregas": 8,
    "entregas_concluidas": 7,
    "entregas_ativas": 1,
    "total_comissao": 84.00,
    "valor_total_vendas": 520.00,
    "tempo_medio_entrega": 22,
    "taxa_conclusao": "87.5"
  },
  "period": "today"
}
```

### **Fluxo de Trabalho do Entregador**
1. **Login** → Autenticação específica para entregador
2. **Atualizar Status** → Marcar como disponível
3. **Ver Entregas** → Lista de pedidos prontos
4. **Aceitar Entrega** → Assumir responsabilidade
5. **Iniciar Entrega** → Sair para entrega + GPS tracking
6. **Finalizar** → Confirmar entrega + recebimento + comissão

---

## 📊 **API 3: APP DO DONO**

### **Funcionalidades Implementadas**
- ✅ **Dashboard Executivo**: KPIs e métricas principais
- ✅ **Relatórios Financeiros**: Receitas, despesas, lucros
- ✅ **Análise de Clientes**: LTV, retenção, segmentação
- ✅ **Análise Operacional**: Horários de pico, performance
- ✅ **Sistema de Alertas**: Notificações inteligentes
- ✅ **Comparações Temporais**: Crescimento e tendências

### **Endpoints da API**

#### **Dashboard Executivo**
```http
GET /api/owner/dashboard?period=today
Authorization: Bearer {token}

Response:
{
  "period": "today",
  "summary": {
    "revenue": {
      "total": 2850.75,
      "growth": 12.5,
      "target_achievement": 95.0,
      "previous_period": 2540.22
    },
    "orders": {
      "total": 42,
      "successful": 40,
      "average_ticket": 67.88,
      "conversion_rate": 85.5
    },
    "performance": {
      "avg_delivery_time": 28,
      "avg_table_time": 85,
      "delivery_orders": 25,
      "table_orders": 17
    }
  },
  "analytics": {
    "top_products": [
      {
        "nome": "Pizza Margherita",
        "tipo": "pizza",
        "quantidade_vendida": 15,
        "receita": 643.50,
        "pedidos": 12
      }
    ],
    "order_types": [
      {
        "tipo": "delivery",
        "quantidade": 25,
        "receita": 1650.00,
        "ticket_medio": 66.00
      },
      {
        "tipo": "mesa",
        "quantidade": 17,
        "receita": 1200.75,
        "ticket_medio": 70.63
      }
    ],
    "payment_methods": [
      {
        "metodo": "cartao",
        "quantidade": 20,
        "valor_total": 1420.50
      },
      {
        "metodo": "pix",
        "quantidade": 15,
        "valor_total": 980.25
      },
      {
        "metodo": "dinheiro",
        "quantidade": 7,
        "valor_total": 450.00
      }
    ]
  }
}
```

#### **Relatório Financeiro Detalhado**
```http
GET /api/owner/reports/financial?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}

Response:
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "revenue": {
    "by_payment_method": {
      "dinheiro": 8520.00,
      "cartao": 15840.50,
      "pix": 12630.25
    },
    "total": 36990.75,
    "delivery_fees": 1850.00
  },
  "expenses": {
    "by_category": [
      {
        "categoria": "ingredientes",
        "valor": 8500.00
      },
      {
        "categoria": "salarios",
        "valor": 6200.00
      },
      {
        "categoria": "combustivel",
        "valor": 800.00
      }
    ],
    "total": 15500.00
  },
  "commissions": {
    "deliverers": 1295.00
  },
  "summary": {
    "receita_total": 36990.75,
    "despesas_total": 15500.00,
    "comissoes_total": 1295.00,
    "lucro_liquido": 20195.75
  },
  "product_analysis": [
    {
      "nome": "Pizza Margherita",
      "tipo": "pizza",
      "quantidade": 180,
      "receita_bruta": 7722.00,
      "custo_total": 3240.00,
      "lucro_bruto": 4482.00,
      "margem": 58
    }
  ]
}
```

#### **Análise de Clientes**
```http
GET /api/owner/analytics/customers
Authorization: Bearer {token}

Response:
{
  "top_customers": [
    {
      "nome": "João Silva",
      "telefone": "(11) 99999-9999",
      "total_pedidos": 25,
      "valor_total": 1680.50,
      "ticket_medio": 67.22,
      "ultimo_pedido": "2024-01-15T18:30:00Z",
      "cliente_desde": "2023-08-10T10:00:00Z",
      "dias_como_cliente": 158
    }
  ],
  "frequency_analysis": [
    {
      "categoria": "VIP (15+)",
      "quantidade_clientes": 8,
      "media_pedidos": 22.5
    },
    {
      "categoria": "Regular (6-15)",
      "quantidade_clientes": 35,
      "media_pedidos": 9.2
    },
    {
      "categoria": "Casual (2-5)",
      "quantidade_clientes": 120,
      "media_pedidos": 3.1
    },
    {
      "categoria": "Único pedido",
      "quantidade_clientes": 85,
      "media_pedidos": 1.0
    }
  ],
  "retention_analysis": [
    {
      "mes": "2024-01-01T00:00:00Z",
      "clientes_ativos": 248
    }
  ],
  "new_customers": [
    {
      "mes": "2024-01-01T00:00:00Z",
      "novos_clientes": 42
    }
  ]
}
```

#### **Análise Operacional**
```http
GET /api/owner/analytics/operations
Authorization: Bearer {token}

Response:
{
  "peak_hours": [
    {
      "hora": 19,
      "quantidade_pedidos": 45,
      "ticket_medio": 72.30,
      "delivery": 28,
      "mesa": 17
    },
    {
      "hora": 20,
      "quantidade_pedidos": 52,
      "ticket_medio": 68.90,
      "delivery": 35,
      "mesa": 17
    }
  ],
  "weekday_analysis": [
    {
      "dia_semana": "Sexta",
      "quantidade_pedidos": 180,
      "receita_total": 12450.80,
      "ticket_medio": 69.17
    },
    {
      "dia_semana": "Sábado",
      "quantidade_pedidos": 220,
      "receita_total": 15680.50,
      "ticket_medio": 71.27
    }
  ],
  "delivery_performance": [
    {
      "nome": "Carlos Silva",
      "total_entregas": 85,
      "tempo_medio": 26,
      "entregas_no_prazo": 78,
      "taxa_pontualidade": 92,
      "total_comissao": 595.00
    }
  ],
  "cancellation_analysis": {
    "total": 12,
    "tempo_medio_ate_cancelamento": 15,
    "delivery": 8,
    "mesa": 4
  },
  "table_occupancy": {
    "mesas_utilizadas": 18,
    "media_pedidos_por_mesa": 2.8,
    "tempo_medio_ocupacao": 75
  }
}
```

#### **Alertas e Notificações**
```http
GET /api/owner/alerts
Authorization: Bearer {token}

Response:
{
  "alerts": [
    {
      "type": "warning",
      "priority": "high",
      "category": "operations",
      "title": "Pedidos em atraso",
      "message": "3 pedidos há mais de 45 minutos sem progressão",
      "data": [
        {
          "id": "pedido-uuid",
          "numero_mesa": 5,
          "tipo_pedido": "mesa",
          "status_pedido": "preparando",
          "data_pedido": "2024-01-15T17:30:00Z"
        }
      ],
      "timestamp": "2024-01-15T18:20:00Z"
    },
    {
      "type": "warning",
      "priority": "medium",
      "category": "inventory",
      "title": "Estoque baixo",
      "message": "2 produtos com estoque baixo",
      "data": [
        {
          "nome": "Mussarela",
          "estoque": 5,
          "estoque_minimo": 10
        }
      ],
      "timestamp": "2024-01-15T18:20:00Z"
    },
    {
      "type": "warning",
      "priority": "medium",
      "category": "sales",
      "title": "Meta de vendas em risco",
      "message": "Vendas hoje: R$ 1200.50 (80% da meta)",
      "data": {
        "vendas_hoje": 1200.50,
        "meta": 1500.00,
        "percentual": 80.03
      },
      "timestamp": "2024-01-15T18:20:00Z"
    }
  ],
  "total": 3
}
```

### **Fluxo de Trabalho do Dono**
1. **Login** → Autenticação específica para proprietário
2. **Dashboard** → Visão geral dos KPIs do período
3. **Análise Financeira** → Receitas, despesas, lucros
4. **Análise de Clientes** → Comportamento e retenção
5. **Análise Operacional** → Performance e eficiência
6. **Alertas** → Problemas que requerem atenção

---

## 🔐 **Sistema de Autenticação JWT**

### **Configuração por App**
```javascript
JWT_CONFIG = {
  waiter: {
    expiresIn: '12h',           // Turno de trabalho
    allowedRoles: ['garcom', 'admin'],
    audience: 'waiter'
  },
  deliverer: {
    expiresIn: '24h',           // Dia de trabalho
    allowedRoles: ['entregador', 'admin'],
    audience: 'deliverer'
  },
  owner: {
    expiresIn: '7d',            // Acesso prolongado
    allowedRoles: ['admin', 'dono'],
    audience: 'owner'
  }
}
```

### **Middleware de Autorização**
```javascript
// Permissões por app e role
waiter_permissions = {
  garcom: ['view_tables', 'create_orders', 'update_order_status'],
  admin:  ['view_tables', 'create_orders', 'update_order_status', 'manage_tables', 'close_tables']
}

deliverer_permissions = {
  entregador: ['view_deliveries', 'accept_delivery', 'update_delivery_status', 'complete_delivery'],
  admin:      ['view_deliveries', 'accept_delivery', 'update_delivery_status', 'view_all_deliveries']
}

owner_permissions = {
  admin: ['view_analytics', 'view_financial_reports', 'view_customer_analytics', 'view_operational_analytics']
}
```

### **Códigos de Erro Padronizados**
```json
{
  "NO_TOKEN": "Token não fornecido",
  "INVALID_TOKEN": "Token inválido ou malformado",
  "TOKEN_EXPIRED": "Token expirado",
  "INVALID_APP_TOKEN": "Token não válido para este app",
  "USER_NOT_AUTHORIZED": "Usuário sem permissão",
  "USER_INACTIVE": "Usuário inativo",
  "INSUFFICIENT_PERMISSION": "Permissão insuficiente"
}
```

---

## 📊 **Rate Limiting e Segurança**

### **Limites por App**
- **App Garçom**: 200 requests / 15 minutos
- **App Entregador**: 300 requests / 15 minutos (mais alto devido ao GPS)
- **App Dono**: 500 requests / 15 minutos (analytics intensivos)

### **Headers de Segurança**
- `Helmet.js` configurado
- `CORS` específico por origem
- `Rate Limiting` por IP e endpoint
- `JWT` com audience validation

---

## 🔄 **WebSocket e Tempo Real**

### **Eventos Suportados**
```javascript
// App Garçom
'orderCreated'        // Novo pedido criado
'orderStatusChanged'  // Status alterado
'tableClosed'         // Mesa fechada

// App Entregador  
'deliveryAccepted'       // Entrega aceita
'deliveryStarted'        // Entrega iniciada
'deliveryCompleted'      // Entrega finalizada
'delivererLocationUpdate' // Localização atualizada

// App Dono
'salesUpdate'         // Vendas atualizadas
'alertTriggered'      // Novo alerta
'performanceUpdate'   // Métricas atualizadas
```

---

## 📚 **Documentação Swagger**

### **Acesso à Documentação**
- **Interface Completa**: `http://localhost:3001/api-docs`
- **App Garçom**: `http://localhost:3001/docs/waiter-app`
- **App Entregador**: `http://localhost:3001/docs/deliverer-app`
- **App Dono**: `http://localhost:3001/docs/owner-app`
- **Autenticação**: `http://localhost:3001/docs/authentication`

### **Features da Documentação**
- ✅ Todos schemas request/response documentados
- ✅ Exemplos de uso para cada endpoint
- ✅ Códigos de erro explicados
- ✅ Interface interativa para testes
- ✅ Filtros por tag e funcionalidade

---

## 🧪 **Testando as APIs**

### **Scripts de Teste Disponíveis**
```bash
# Testar App Garçom
curl -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/waiter/tables

# Testar App Entregador
curl -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/deliverer/deliveries

# Testar App Dono
curl -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/owner/dashboard?period=today
```

### **Endpoints de Health Check**
```bash
# Status geral
GET /api/health

# Status por app
GET /api/waiter/health
GET /api/deliverer/health
GET /api/owner/health
```

---

## 📱 **Próximos Passos para Implementação**

### **1. Frontend Apps**
- [ ] **React/Vue/Angular** para cada app
- [ ] **Responsive design** para mobile/tablet
- [ ] **PWA capabilities** para instalação
- [ ] **Offline functionality** com cache local

### **2. Mobile Apps**
- [ ] **React Native** ou **Flutter**
- [ ] **Push notifications**
- [ ] **GPS tracking nativo**
- [ ] **Câmera para comprovantes**

### **3. Deploy e Produção**
- [ ] **Docker containers**
- [ ] **CI/CD pipeline**
- [ ] **SSL certificates**
- [ ] **Monitoring e logging**

---

## ✅ **Status das APIs**

### **Implementado e Funcional**
- ✅ **Backend APIs**: 100% implementadas
- ✅ **Autenticação JWT**: Sistema completo por app
- ✅ **Documentação**: Swagger OpenAPI 3.0
- ✅ **Rate Limiting**: Configurado por app
- ✅ **WebSocket**: Eventos em tempo real
- ✅ **Middleware**: Autorização RBAC
- ✅ **Error Handling**: Códigos padronizados
- ✅ **Database**: Queries otimizadas

### **Pronto para Agentes**
- ✅ **Templates de implementação**
- ✅ **Guia de integração completo**
- ✅ **Schemas documentados**
- ✅ **Exemplos de código**
- ✅ **Fluxos de trabalho definidos**

**🚀 APIs 100% prontas para desenvolvimento automatizado!**