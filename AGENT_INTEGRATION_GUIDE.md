# 🤖 Guia de Integração para Agentes Automatizados

## 📋 **APIs Completas Prontas para Desenvolvimento Automatizado**

Este documento fornece todas as informações necessárias para agentes automatizados criarem os 3 aplicativos premium do sistema de pizzaria.

---

## 🎯 **Visão Geral do Sistema**

### **Arquitetura Implementada**
```
Sistema Principal (Atendente) ─┐
                               ├─► Backend APIs Centralizado ◄─┐
App Garçom (Premium) ─────────┘                                ├─► PostgreSQL
App Entregador (Premium) ───────────────────────────────────────┤
App Dono (Premium) ─────────────────────────────────────────────┘
```

### **APIs Disponíveis**
- ✅ **App Garçom**: `/api/waiter/*` - Gestão de mesas e pedidos
- ✅ **App Entregador**: `/api/deliverer/*` - Gestão de entregas e rotas  
- ✅ **App Dono**: `/api/owner/*` - Analytics e métricas executivas
- ✅ **Sistema Auth**: JWT específico por app + RBAC
- ✅ **Documentação**: Swagger/OpenAPI completa

---

## 🔧 **Configuração do Ambiente**

### **Backend (Node.js/Express)**
```bash
cd backend
npm install
npm install swagger-jsdoc swagger-ui-express --save
```

### **Dependências Adicionais**
```json
{
  "express-rate-limit": "^6.7.0",
  "jsonwebtoken": "^9.0.0", 
  "bcryptjs": "^2.4.3",
  "pg": "^8.11.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5"
}
```

### **Variáveis de Ambiente**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=8477

# JWT
JWT_SECRET=pizzaria-secret-key

# Server
PORT=3001
NODE_ENV=development
```

---

## 📱 **API 1: APP DO GARÇOM**

### **Funcionalidades Core**
- ✅ Listagem e gerenciamento de mesas
- ✅ Criação de pedidos de mesa
- ✅ Atualização de status dos pedidos
- ✅ Fechamento de contas
- ✅ Cardápio dinâmico
- ✅ Notificações em tempo real

### **Endpoints Implementados**
```javascript
// Autenticação específica
POST /api/auth/waiter/login

// Gestão de mesas
GET    /api/waiter/tables
GET    /api/waiter/table/:tableNumber/orders  
POST   /api/waiter/table/:tableNumber/close

// Gestão de pedidos
POST   /api/waiter/orders
PATCH  /api/waiter/orders/:orderId/status

// Recursos auxiliares
GET    /api/waiter/menu
GET    /api/waiter/notifications
```

### **Modelo de Dados**
```sql
-- Mesas (virtuais 1-20)
numero_mesa: INTEGER
status: ENUM('livre', 'ocupada', 'reservada')
pedidos_ativos: INTEGER
valor_conta: DECIMAL
tempo_ocupacao: STRING

-- Pedidos de Mesa
tipo_pedido: 'mesa'
numero_mesa: INTEGER
status_pedido: ENUM('pendente', 'preparando', 'pronto', 'retirado', 'fechada')
```

### **Permissões RBAC**
```javascript
garcom: ['view_tables', 'create_orders', 'update_order_status']
admin:  ['view_tables', 'create_orders', 'update_order_status', 'manage_tables', 'close_tables']
```

### **Rate Limiting**
- 200 requests por 15 minutos por IP
- Middleware específico para operações de mesa

---

## 🚚 **API 2: APP DO ENTREGADOR**

### **Funcionalidades Core**
- ✅ Perfil e estatísticas do entregador
- ✅ Listagem de entregas disponíveis
- ✅ Sistema de aceitar/rejeitar entregas
- ✅ Tracking de localização GPS
- ✅ Finalização de entregas com comprovante
- ✅ Histórico e comissões

### **Endpoints Implementados**
```javascript
// Perfil e status
GET    /api/deliverer/profile
PATCH  /api/deliverer/status
POST   /api/deliverer/location

// Gestão de entregas
GET    /api/deliverer/deliveries
POST   /api/deliverer/deliveries/:orderId/accept
POST   /api/deliverer/deliveries/:orderId/start  
POST   /api/deliverer/deliveries/:orderId/complete

// Analytics
GET    /api/deliverer/stats
```

### **Modelo de Dados**
```sql
-- Entregadores
nome: VARCHAR
telefone: VARCHAR
veiculo: VARCHAR
status: ENUM('disponivel', 'ocupado', 'offline')
ultima_localizacao: POINT (PostGIS)

-- Entregas
tipo_pedido: 'delivery'
entregador_id: UUID
status_pedido: ENUM('preparando', 'pronto', 'saiu_para_entrega', 'entregue')
taxa_entrega: DECIMAL
data_saida_entrega: TIMESTAMP
```

### **Permissões RBAC**
```javascript
entregador: ['view_deliveries', 'accept_delivery', 'update_delivery_status', 'complete_delivery']
admin:      ['view_deliveries', 'accept_delivery', 'update_delivery_status', 'view_all_deliveries']
```

### **Rate Limiting**
- 300 requests por 15 minutos (mais alto devido ao GPS)

---

## 📊 **API 3: APP DO DONO**

### **Funcionalidades Core**
- ✅ Dashboard executivo completo
- ✅ Relatórios financeiros detalhados
- ✅ Análise de clientes e retenção
- ✅ Análise operacional (horários de pico, performance)
- ✅ Sistema de alertas inteligentes
- ✅ Métricas de crescimento e KPIs

### **Endpoints Implementados**
```javascript
// Dashboard e KPIs
GET /api/owner/dashboard?period=today|week|month|quarter|year

// Relatórios específicos  
GET /api/owner/reports/financial?start_date=2024-01-01&end_date=2024-01-31
GET /api/owner/analytics/customers
GET /api/owner/analytics/operations

// Alertas e notificações
GET /api/owner/alerts
```

### **Métricas Disponíveis**
```javascript
// Dashboard Executivo
revenue: { total, growth, target_achievement }
orders: { total, average_ticket, conversion_rate }
performance: { delivery_time_avg, table_turnover }

// Análise Financeira
revenue_by_payment_method: { dinheiro, cartao, pix }
expenses_by_category: Array
product_profit_analysis: Array
commission_tracking: Object

// Análise de Clientes
top_customers: Array (LTV, frequency)
customer_segmentation: Array
retention_analysis: Array
new_customer_acquisition: Array

// Análise Operacional
peak_hours_analysis: Array
weekday_performance: Array  
delivery_performance: Array
cancellation_analysis: Object
```

### **Permissões RBAC**
```javascript
admin: ['view_analytics', 'view_financial_reports', 'view_customer_analytics', 'view_operational_analytics', 'manage_alerts']
```

### **Rate Limiting**
- 500 requests por 15 minutos (analytics intensivos)

---

## 🔐 **Sistema de Autenticação JWT**

### **Tokens Específicos por App**
```javascript
// Configuração por app
JWT_CONFIG = {
  waiter: { 
    expiresIn: '12h',      // Turno de trabalho
    allowedRoles: ['garcom', 'admin'],
    audience: 'waiter'
  },
  deliverer: { 
    expiresIn: '24h',      // Dia de trabalho  
    allowedRoles: ['entregador', 'admin'],
    audience: 'deliverer'
  },
  owner: { 
    expiresIn: '7d',       // Acesso prolongado
    allowedRoles: ['admin', 'dono'],
    audience: 'owner'
  }
}
```

### **Middleware de Autenticação**
```javascript
// Importar middleware específico
const { authenticateWaiter, authenticateDeliverer, authenticateOwner } = require('./middleware/app-auth');

// Aplicar nas rotas
router.use('/waiter', authenticateWaiter);
router.use('/deliverer', authenticateDeliverer);  
router.use('/owner', authenticateOwner);
```

### **Códigos de Erro Padronizados**
```javascript
{
  'NO_TOKEN': 'Token não fornecido',
  'INVALID_TOKEN': 'Token inválido ou malformado', 
  'TOKEN_EXPIRED': 'Token expirado',
  'INVALID_APP_TOKEN': 'Token não válido para este app',
  'USER_NOT_AUTHORIZED': 'Usuário sem permissão',
  'USER_INACTIVE': 'Usuário inativo'
}
```

---

## 📚 **Documentação Swagger/OpenAPI**

### **Acesso à Documentação**
```bash
# Swagger UI completo
http://localhost:3001/api-docs

# Documentação por app
http://localhost:3001/docs/waiter-app
http://localhost:3001/docs/deliverer-app  
http://localhost:3001/docs/owner-app
http://localhost:3001/docs/authentication
```

### **Schemas Disponíveis**
- ✅ Todos os modelos de request/response documentados
- ✅ Códigos de erro padronizados
- ✅ Exemplos de uso para cada endpoint
- ✅ Esquemas de autenticação por app

---

## 🚀 **Instruções para Agentes Automatizados**

### **1. Criar App Frontend (React/Vue/Angular)**

```javascript
// Estrutura recomendada
src/
├── components/
│   ├── waiter/     // Componentes do app garçom
│   ├── deliverer/  // Componentes do app entregador  
│   └── owner/      // Componentes do app dono
├── services/
│   ├── waiterAPI.js    // Cliente API garçom
│   ├── delivererAPI.js // Cliente API entregador
│   └── ownerAPI.js     // Cliente API dono
├── hooks/
│   ├── useAuth.js      // Hook de autenticação
│   └── useWebSocket.js // Hook para real-time
└── pages/
    ├── WaiterApp.jsx   // Página principal garçom
    ├── DelivererApp.jsx // Página principal entregador
    └── OwnerApp.jsx    // Página principal dono
```

### **2. Cliente API Base**
```javascript
// services/apiClient.js
class APIClient {
  constructor(baseURL, appType) {
    this.baseURL = baseURL;
    this.appType = appType;
    this.token = localStorage.getItem(`${appType}_token`);
  }

  setAuthHeader() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'X-App-Type': this.appType
    };
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}/api/${this.appType}${endpoint}`;
    
    const config = {
      method,
      headers: this.setAuthHeader()
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expirado - redirecionar para login
      this.handleTokenExpired();
      throw new Error('Token expired');
    }

    return response.json();
  }

  // Métodos específicos para cada operação
  async get(endpoint) { return this.request('GET', endpoint); }
  async post(endpoint, data) { return this.request('POST', endpoint, data); }
  async patch(endpoint, data) { return this.request('PATCH', endpoint, data); }
}
```

### **3. Implementação WebSocket (Tempo Real)**
```javascript
// hooks/useWebSocket.js
export const useWebSocket = (appType) => {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Filtrar eventos por app
      if (appType === 'waiter' && data.type === 'orderStatusChanged') {
        // Atualizar estado do app garçom
      }
      
      if (appType === 'deliverer' && data.type === 'deliveryAccepted') {
        // Atualizar estado do app entregador
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [appType]);

  return socket;
};
```

### **4. Estados de Aplicação por App**

```javascript
// App Garçom - Estado Global
const waiterState = {
  tables: [],           // Lista de mesas
  activeOrders: [],     // Pedidos ativos
  menu: [],            // Cardápio
  notifications: []     // Notificações
};

// App Entregador - Estado Global  
const delivererState = {
  profile: {},         // Perfil do entregador
  availableOrders: [], // Entregas disponíveis
  myDeliveries: [],    // Minhas entregas
  location: {},        // Localização atual
  stats: {}           // Estatísticas
};

// App Dono - Estado Global
const ownerState = {
  dashboard: {},       // Métricas principais
  financialReport: {}, // Relatório financeiro
  customerAnalytics: {}, // Análise clientes
  alerts: []          // Alertas
};
```

---

## 🛠️ **Templates de Implementação**

### **Template: Componente Lista de Mesas (App Garçom)**
```jsx
// components/waiter/TablesList.jsx
import { useState, useEffect } from 'react';
import { waiterAPI } from '../../services/waiterAPI';

export const TablesList = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await waiterAPI.get('/tables');
      setTables(response.tables);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'livre': return 'bg-green-500';
      case 'ocupada': return 'bg-red-500';
      case 'reservada': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return <div>Carregando mesas...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {tables.map(table => (
        <div 
          key={table.numero_mesa}
          className={`p-4 rounded-lg text-white ${getTableStatusColor(table.status)}`}
          onClick={() => handleTableClick(table)}
        >
          <h3 className="text-lg font-bold">Mesa {table.numero_mesa}</h3>
          <p>Status: {table.status}</p>
          <p>Pedidos: {table.pedidos_ativos}</p>
          <p>Valor: R$ {table.valor_conta.toFixed(2)}</p>
          {table.tempo_ocupacao && (
            <p>Tempo: {table.tempo_ocupacao}</p>
          )}
        </div>
      ))}
    </div>
  );
};
```

### **Template: Componente Mapa de Entregas (App Entregador)**
```jsx
// components/deliverer/DeliveryMap.jsx
import { useState, useEffect } from 'react';
import { delivererAPI } from '../../services/delivererAPI';

export const DeliveryMap = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [myLocation, setMyLocation] = useState(null);

  useEffect(() => {
    loadDeliveries();
    trackLocation();
  }, []);

  const loadDeliveries = async () => {
    try {
      const response = await delivererAPI.get('/deliveries');
      setDeliveries(response.deliveries);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    }
  };

  const trackLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setMyLocation(location);
          
          // Enviar localização para servidor
          delivererAPI.post('/location', location);
        },
        (error) => console.error('Erro de geolocalização:', error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );
    }
  };

  const acceptDelivery = async (orderId) => {
    try {
      await delivererAPI.post(`/deliveries/${orderId}/accept`);
      loadDeliveries(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao aceitar entrega:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Informações de localização */}
      <div className="bg-blue-100 p-4 rounded">
        <h3>Minha Localização</h3>
        {myLocation ? (
          <p>Lat: {myLocation.latitude.toFixed(6)}, Lng: {myLocation.longitude.toFixed(6)}</p>
        ) : (
          <p>Aguardando GPS...</p>
        )}
      </div>

      {/* Lista de entregas */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Entregas Disponíveis</h3>
        {deliveries.map(delivery => (
          <div key={delivery.id} className="border p-4 rounded">
            <h4 className="font-semibold">{delivery.cliente_nome}</h4>
            <p>Endereço: {delivery.endereco}</p>
            <p>Valor: R$ {delivery.valor_total.toFixed(2)}</p>
            <p>Taxa: R$ {delivery.taxa_entrega.toFixed(2)}</p>
            <p className={`font-medium ${getPriorityColor(delivery.priority)}`}>
              Prioridade: {delivery.priority}
            </p>
            
            <button 
              onClick={() => acceptDelivery(delivery.id)}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Aceitar Entrega
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Template: Dashboard Analytics (App Dono)**
```jsx
// components/owner/AnalyticsDashboard.jsx
import { useState, useEffect } from 'react';
import { ownerAPI } from '../../services/ownerAPI';

export const AnalyticsDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      const response = await ownerAPI.get(`/dashboard?period=${period}`);
      setDashboard(response);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando analytics...</div>;
  if (!dashboard) return <div>Erro ao carregar dados</div>;

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex space-x-2">
        {['today', 'week', 'month', 'quarter', 'year'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded ${
              period === p ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Receita</h3>
          <p className="text-3xl font-bold text-green-600">
            R$ {dashboard.summary.revenue.total.toFixed(2)}
          </p>
          <p className={`text-sm ${dashboard.summary.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {dashboard.summary.revenue.growth > 0 ? '+' : ''}{dashboard.summary.revenue.growth.toFixed(1)}% vs período anterior
          </p>
        </div>

        <div className="bg-blue-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Pedidos</h3>
          <p className="text-3xl font-bold text-blue-600">
            {dashboard.summary.orders.total}
          </p>
          <p className="text-sm text-blue-600">
            Ticket médio: R$ {dashboard.summary.orders.average_ticket.toFixed(2)}
          </p>
        </div>

        <div className="bg-purple-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Performance</h3>
          <p className="text-xl font-bold text-purple-600">
            {dashboard.summary.performance.avg_delivery_time} min
          </p>
          <p className="text-sm text-purple-600">Tempo médio de entrega</p>
        </div>
      </div>

      {/* Top produtos */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Produtos</h3>
        <div className="space-y-2">
          {dashboard.analytics.top_products.slice(0, 5).map((product, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="font-medium">{product.nome}</span>
              <div className="text-right">
                <span className="text-green-600 font-semibold">
                  R$ {product.receita.toFixed(2)}
                </span>
                <span className="text-gray-500 text-sm ml-2">
                  ({product.quantidade_vendida} un.)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      <AlertsPanel />
    </div>
  );
};
```

---

## 🔍 **Testing & Debugging**

### **Scripts de Teste**
```bash
# Testar APIs individualmente
node test-waiter-api.js      # Testa app garçom
node test-deliverer-api.js   # Testa app entregador  
node test-owner-api.js       # Testa app dono

# Testar autenticação
node test-app-auth.js        # Testa sistema JWT

# Health check completo
curl http://localhost:3001/api/health
```

### **Endpoints de Debug**
```javascript
// Status de cada API
GET /api/waiter/health
GET /api/deliverer/health  
GET /api/owner/health

// Verificar permissões
GET /api/auth/permissions
```

---

## 📦 **Deploy e Produção**

### **Build para Produção**
```bash
# Backend
npm run build
npm start

# Frontend (exemplo React)
npm run build
serve -s build -l 3000
```

### **Docker Configuration**
```dockerfile
# Dockerfile.apps
FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de config
COPY package*.json ./
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Instalar dependências
RUN npm install
RUN cd frontend && npm install && npm run build

# Expor portas
EXPOSE 3001 3000

# Start script
CMD ["npm", "run", "start:production"]
```

---

## 🎯 **Checklist para Agentes**

### **✅ Backend APIs (Completo)**
- [x] API App Garçom implementada
- [x] API App Entregador implementada  
- [x] API App Dono implementada
- [x] Sistema de autenticação JWT
- [x] Middleware de autorização RBAC
- [x] Documentação Swagger completa
- [x] Rate limiting configurado
- [x] WebSocket para tempo real
- [x] Tratamento de erros padronizado

### **🔲 Frontend Apps (Para Implementar)**
- [ ] App Garçom (React/Vue/Angular)
- [ ] App Entregador (React/Vue/Angular)
- [ ] App Dono (React/Vue/Angular)
- [ ] Sistema de login específico
- [ ] Integração WebSocket
- [ ] Offline capability (PWA)
- [ ] Responsive design
- [ ] Testes automatizados

### **🔲 Deployment (Para Implementar)**
- [ ] Docker containers
- [ ] CI/CD pipeline
- [ ] Environment configs
- [ ] SSL certificates
- [ ] Monitoring & logging
- [ ] Backup strategy

---

## 🚀 **Próximos Passos**

1. **Agente Frontend**: Criar interfaces baseadas nos templates acima
2. **Agente Mobile**: Adaptar para React Native/Flutter  
3. **Agente Testing**: Implementar testes automatizados
4. **Agente Deploy**: Configurar pipeline CI/CD
5. **Agente Monitoring**: Implementar observabilidade

**APIs estão 100% prontas e documentadas. Agentes podem começar development imediatamente!** 🎉