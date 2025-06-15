// Configurações da API
export const API_BASE_URL = 'http://192.168.223.24:3001/api'; // IP atual da máquina WSL
export const WS_BASE_URL = 'ws://192.168.223.24:3001'; // WebSocket URL

// Status de pedidos
export const ORDER_STATUS = {
  PENDING: 'pendente',
  PREPARING: 'preparando',
  READY: 'pronto',
  OUT_FOR_DELIVERY: 'saiu_para_entrega',
  DELIVERED: 'entregue',
  CANCELLED: 'cancelado'
};

// Traduções de status
export const STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendente',
  [ORDER_STATUS.PREPARING]: 'Preparando',
  [ORDER_STATUS.READY]: 'Pronto',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Saiu para entrega',
  [ORDER_STATUS.DELIVERED]: 'Entregue',
  [ORDER_STATUS.CANCELLED]: 'Cancelado'
};

// Cores para status
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: '#FF9800',
  [ORDER_STATUS.PREPARING]: '#2196F3',
  [ORDER_STATUS.READY]: '#4CAF50',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: '#9C27B0',
  [ORDER_STATUS.DELIVERED]: '#8BC34A',
  [ORDER_STATUS.CANCELLED]: '#F44336'
};

// Formas de pagamento
export const PAYMENT_METHODS = {
  CASH: 'dinheiro',
  CARD: 'cartao',
  PIX: 'pix',
  MULTIPLE: 'multiplos'
};

// Traduções de formas de pagamento
export const PAYMENT_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Dinheiro',
  [PAYMENT_METHODS.CARD]: 'Cartão',
  [PAYMENT_METHODS.PIX]: 'PIX',
  [PAYMENT_METHODS.MULTIPLE]: 'Múltiplos'
};

// Configurações de sincronização
export const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 segundos
  CACHE_EXPIRY: 300000 // 5 minutos
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  SOUND_ENABLED: true,
  VIBRATION_ENABLED: true,
  NEW_ORDER_SOUND: 'default',
  UPDATE_SOUND: 'default'
};

// Configurações de interface
export const UI_CONFIG = {
  REFRESH_INTERVAL: 10000, // 10 segundos
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000
};

// URLs para desenvolvimento e produção
export const ENVIRONMENT = {
  development: {
    API_BASE_URL: 'http://192.168.223.24:3001/api',
    WS_BASE_URL: 'ws://192.168.223.24:3001'
  },
  production: {
    API_BASE_URL: 'https://seu-servidor.com/api',
    WS_BASE_URL: 'wss://seu-servidor.com'
  }
};

// Configuração atual (altere conforme necessário)
export const CURRENT_ENV = 'development';

// Validações
export const VALIDATION = {
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  PASSWORD_MIN_LENGTH: 6,
  ORDER_ID_LENGTH: 36 // UUID length
};

// Mensagens padrão
export const MESSAGES = {
  CONNECTION_ERROR: 'Erro de conexão. Verifique sua internet.',
  LOGIN_ERROR: 'Erro no login. Verifique suas credenciais.',
  NO_ORDERS: 'Nenhum pedido encontrado.',
  OFFLINE_MODE: 'Modo offline ativo. Dados podem estar desatualizados.',
  SYNC_SUCCESS: 'Dados sincronizados com sucesso.',
  SYNC_ERROR: 'Erro na sincronização. Tentaremos novamente.',
  ORDER_ACCEPTED: 'Pedido aceito com sucesso!',
  ORDER_DELIVERED: 'Entrega confirmada!',
  PERMISSION_DENIED: 'Permissão negada. Verifique as configurações do app.'
};

// Configurações de cache
export const CACHE_KEYS = {
  ORDERS: 'cached_orders',
  HISTORY: 'delivery_history',
  SETTINGS: 'app_settings',
  USER_DATA: 'user_data'
};

// Tipos de log
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  DEBUG: 'debug',
  PENDING_ACTION: 'pending_action'
};