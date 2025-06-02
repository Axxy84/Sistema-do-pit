/**
 * Gerador de chaves de cache para o ERP de pizzaria
 * Centraliza a geração de chaves para manter consistência
 */

const CacheKeys = {
  // Dashboard
  DASHBOARD_DATA: 'dashboard:data',
  DASHBOARD_KPIS: (date) => `dashboard:kpis:${date}`,
  DASHBOARD_TOP_PIZZAS: (days) => `dashboard:top_pizzas:${days}`,
  DASHBOARD_SALES_OVERTIME: (days) => `dashboard:sales_overtime:${days}`,
  DASHBOARD_RECENT_ORDERS: 'dashboard:recent_orders',

  // Relatórios
  REPORTS_SALES: (startDate, endDate) => `reports:sales:${startDate}:${endDate}`,
  REPORTS_FECHAMENTOS: (startDate, endDate) => `reports:fechamentos:${startDate}:${endDate}`,
  REPORTS_TOP_PRODUCTS: (startDate, endDate, limit) => `reports:top_products:${startDate}:${endDate}:${limit}`,
  REPORTS_CUSTOMERS: (startDate, endDate) => `reports:customers:${startDate}:${endDate}`,

  // Fechamento de Caixa
  CASH_CLOSING_CURRENT: (date) => `cash_closing:current:${date}`,
  CASH_CLOSING_LIST: (startDate, endDate) => `cash_closing:list:${startDate || 'all'}:${endDate || 'all'}`,
  CASH_CLOSING_BY_ID: (id) => `cash_closing:${id}`,

  // Pedidos
  ORDERS_LIST: (status, startDate, endDate, clientId) => {
    const parts = ['orders:list'];
    if (status) parts.push(`status:${status}`);
    if (startDate) parts.push(`start:${startDate}`);
    if (endDate) parts.push(`end:${endDate}`);
    if (clientId) parts.push(`client:${clientId}`);
    return parts.join(':');
  },
  ORDERS_BY_ID: (id) => `orders:${id}`,
  ORDERS_PENDING: 'orders:pending',

  // Produtos
  PRODUCTS_LIST: 'products:list',
  PRODUCTS_BY_TYPE: (type) => `products:type:${type}`,
  PRODUCTS_BY_ID: (id) => `products:${id}`,

  // Clientes
  CUSTOMERS_LIST: 'customers:list',
  CUSTOMERS_BY_ID: (id) => `customers:${id}`,
  CUSTOMERS_TOP: (startDate, endDate) => `customers:top:${startDate}:${endDate}`,

  // Padrões para invalidação
  PATTERNS: {
    DASHBOARD: 'dashboard:.*',
    REPORTS: 'reports:.*',
    CASH_CLOSING: 'cash_closing:.*',
    ORDERS: 'orders:.*',
    PRODUCTS: 'products:.*',
    CUSTOMERS: 'customers:.*'
  }
};

/**
 * Função para gerar chave de cache normalizada
 * Remove caracteres especiais e converte para minúsculas
 */
function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9:_-]/g, '_');
}

/**
 * Função para gerar chave baseada em data
 */
function getDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Função para gerar chave baseada em período
 */
function getPeriodKey(startDate, endDate) {
  const start = startDate ? new Date(startDate).toISOString().split('T')[0] : 'all';
  const end = endDate ? new Date(endDate).toISOString().split('T')[0] : 'all';
  return `${start}:${end}`;
}

module.exports = {
  CacheKeys,
  normalizeKey,
  getDateKey,
  getPeriodKey
}; 