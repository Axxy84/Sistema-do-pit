# 📱 App do Entregador - Sistema do PIT

App React Native para entregadores do sistema de delivery da pizzaria.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação segura** via JWT
- **Cache offline** com SQLite para funcionar sem internet
- **Notificações push** para novos pedidos
- **WebSocket** para atualizações em tempo real
- **Sincronização automática** quando volta online
- **Interface moderna** com React Native Paper

### 📋 Fluxo do Entregador
1. **Login** com telefone e senha
2. **Receber notificações** de novos pedidos
3. **Aceitar pedidos** disponíveis
4. **Ver detalhes** completos (cliente, itens, endereço)
5. **Marcar como entregue** quando concluído
6. **Consultar histórico** de entregas

## 🛠️ Tecnologias

- **React Native** + Expo
- **SQLite** (expo-sqlite) para cache offline
- **React Navigation** para navegação
- **React Native Paper** para UI components
- **Axios** para requisições HTTP
- **WebSocket** para tempo real
- **Expo Notifications** para push notifications

## 📦 Instalação

### 1. Instalar dependências
```bash
cd deliverer-app
npm install
```

### 2. Configurar backend
```bash
# No diretório backend/
node setup-deliverer-table.js
npm run dev
```

### 3. Configurar endereços
Edite `src/utils/constants.js`:
```javascript
export const API_BASE_URL = 'http://SEU_IP:3001/api';
export const WS_BASE_URL = 'ws://SEU_IP:3001';
```

### 4. Executar app
```bash
npx expo start
```

## 🔐 Credenciais de Teste

Após executar `setup-deliverer-table.js`, use:

| Entregador | Telefone | Senha |
|------------|----------|-------|
| João Silva | 11999999999 | 123456 |
| Maria Santos | 11888888888 | 123456 |
| Carlos Oliveira | 11777777777 | 123456 |

## 🗄️ Estrutura do Banco SQLite

### Tabelas Criadas Automaticamente:
- **cached_orders**: Cache de pedidos para modo offline
- **delivery_history**: Histórico local de entregas
- **app_settings**: Configurações do aplicativo
- **app_logs**: Logs para debug e ações pendentes

## 🔄 API Endpoints

### Autenticação
- `POST /api/deliverer-app/auth/login` - Login do entregador
- `GET /api/deliverer-app/auth/me` - Validar token

### Pedidos
- `GET /api/deliverer-app/pedidos/disponiveis` - Pedidos disponíveis
- `GET /api/deliverer-app/pedidos/meus` - Meus pedidos
- `GET /api/deliverer-app/pedidos/:id/detalhes` - Detalhes do pedido
- `POST /api/deliverer-app/pedidos/:id/aceitar` - Aceitar pedido
- `POST /api/deliverer-app/pedidos/:id/entregar` - Marcar como entregue
- `GET /api/deliverer-app/historico` - Histórico de entregas

### WebSocket
- **URL**: `ws://localhost:3001/ws/deliverer`
- **Eventos**: `new_order`, `order_update`, `auth_success`

## 🚨 Funcionalidade Offline

### O que funciona offline:
- ✅ Login (se token válido salvo)
- ✅ Visualizar pedidos aceitos (cache)
- ✅ Ver histórico de entregas
- ✅ Marcar pedidos como entregue (sincroniza depois)

### O que precisa de internet:
- ❌ Aceitar novos pedidos
- ❌ Receber notificações de novos pedidos
- ❌ Sincronizar dados com servidor

## 📱 Estrutura do App

```
src/
├── services/           # Lógica de negócio
│   ├── AuthService.js     # Autenticação JWT
│   ├── DatabaseService.js # SQLite local
│   ├── OrderService.js    # Gestão de pedidos
│   ├── WebSocketService.js # Tempo real
│   └── NotificationService.js # Push notifications
├── screens/            # Telas do app
│   ├── LoginScreen.js     # Tela de login
│   ├── HomeScreen.js      # Dashboard principal
│   ├── OrdersScreen.js    # Lista de pedidos
│   ├── OrderDetailScreen.js # Detalhes do pedido
│   ├── HistoryScreen.js   # Histórico
│   └── ProfileScreen.js   # Perfil do entregador
├── context/           # Context API
│   ├── AuthContext.js     # Estado de autenticação
│   └── OrderContext.js    # Estado dos pedidos
├── utils/             # Utilitários
│   ├── constants.js       # Configurações
│   └── theme.js          # Tema e estilos
└── components/        # Componentes reutilizáveis
```

## 🔧 Configurações

### constants.js - Principais configurações:
```javascript
// URLs do servidor
export const API_BASE_URL = 'http://192.168.0.105:3001/api';
export const WS_BASE_URL = 'ws://192.168.0.105:3001';

// Sincronização
export const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  CACHE_EXPIRY: 300000 // 5 minutos
};
```

## 📋 Como Usar

### 1. Primeiro Login
1. Abra o app
2. Digite telefone: `11999999999`
3. Digite senha: `123456`
4. Toque em "Entrar"

### 2. Receber Pedidos
1. Aguarde notificação de novo pedido
2. Vá para aba "Pedidos"
3. Veja pedidos disponíveis
4. Toque em "Aceitar" no pedido desejado

### 3. Entregar Pedido
1. Vá para aba "Pedidos" 
2. Veja seus pedidos aceitos
3. Toque no pedido para ver detalhes
4. Toque em "Marcar como Entregue"

### 4. Ver Histórico
1. Vá para aba "Histórico"
2. Veja todas as entregas realizadas
3. Filtre por período se necessário

## 🐛 Debug e Logs

### Ver logs do SQLite:
```javascript
import { DatabaseService } from './src/services/DatabaseService';

// Ver logs recentes
const logs = await DatabaseService.getLogs(50);
console.log('Logs:', logs);

// Ver estatísticas do banco
const stats = await DatabaseService.getStorageInfo();
console.log('Storage:', stats);
```

### Limpar cache:
```javascript
// Limpar cache de pedidos
await DatabaseService.clearCache();

// Limpar logs antigos
await DatabaseService.clearOldLogs(7); // 7 dias
```

## 🔄 Sincronização

### Como funciona:
1. **Online**: Dados são salvos no servidor e cache local
2. **Offline**: Ações são salvas como "pending" no SQLite
3. **Volta online**: App sincroniza ações pendentes automaticamente

### Monitorar sincronização:
```javascript
import { OrderService } from './src/services/OrderService';

// Verificar status
const isOnline = OrderService.getOnlineStatus();

// Forçar sincronização
await OrderService.syncPendingActions();
```

## 🚀 Build e Deploy

### Android (APK):
```bash
expo build:android
```

### iOS (IPA):
```bash
expo build:ios
```

### Web (Teste):
```bash
npm run web
```

## ⚠️ Troubleshooting

### Problema: "Network Error"
- Verifique se o backend está rodando na porta 3001
- Confirme o IP correto em `constants.js`
- Teste: `curl http://IP:3001/api/health`

### Problema: "Token inválido"
- Execute `setup-deliverer-table.js` no backend
- Verifique se as senhas foram criadas
- Teste login via API

### Problema: WebSocket não conecta
- Verifique se WebSocket está funcionando
- Teste: `ws://IP:3001/ws/deliverer`
- Verifique firewall/proxy

### Problema: Notificações não chegam
- Verifique permissões do dispositivo
- Teste em dispositivo físico (não funciona no simulador)
- Verifique configuração do Expo

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique logs do app e backend
2. Teste conectividade de rede
3. Confirme credenciais de teste
4. Verifique configurações de IP/porta