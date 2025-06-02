/**
 * Middleware de Invalidação de Cache
 * Centraliza a lógica de invalidação baseada em operações do sistema
 */

const cache = require('../cache/cache-manager');
const { CacheKeys } = require('../cache/cache-keys');

/**
 * Middleware para invalidar caches relacionados a pedidos
 * Usado após operações de CREATE, UPDATE, DELETE em pedidos
 */
function invalidateOrderRelatedCaches(req, res, next) {
  // Hook para invalidar cache após resposta bem-sucedida
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    // Se operação foi bem-sucedida (status 2xx), invalidar caches
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Invalidar caches de pedidos
      cache.deletePattern(CacheKeys.PATTERNS.ORDERS);
      
      // Invalidar dashboard (KPIs, pedidos recentes, etc.)
      cache.deletePattern(CacheKeys.PATTERNS.DASHBOARD);
      
      // Invalidar relatórios que dependem de pedidos
      cache.deletePattern(CacheKeys.PATTERNS.REPORTS);
      
      console.log('🧹 Auto-invalidated order-related caches');
    }
    
    return result;
  };
  
  next();
}

/**
 * Middleware para invalidar caches relacionados a fechamento de caixa
 */
function invalidateCashClosingRelatedCaches(req, res, next) {
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Invalidar caches de fechamento
      cache.deletePattern(CacheKeys.PATTERNS.CASH_CLOSING);
      
      // Invalidar dashboard e relatórios
      cache.deletePattern(CacheKeys.PATTERNS.DASHBOARD);
      cache.deletePattern(CacheKeys.PATTERNS.REPORTS);
      
      console.log('🧹 Auto-invalidated cash closing-related caches');
    }
    
    return result;
  };
  
  next();
}

/**
 * Middleware para invalidar caches relacionados a clientes
 */
function invalidateCustomerRelatedCaches(req, res, next) {
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Invalidar caches de clientes
      cache.deletePattern(CacheKeys.PATTERNS.CUSTOMERS);
      
      // Invalidar relatórios de clientes
      cache.deletePattern('reports:customers:.*');
      
      console.log('🧹 Auto-invalidated customer-related caches');
    }
    
    return result;
  };
  
  next();
}

/**
 * Middleware para invalidar caches relacionados a produtos
 */
function invalidateProductRelatedCaches(req, res, next) {
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Invalidar caches de produtos
      cache.deletePattern(CacheKeys.PATTERNS.PRODUCTS);
      
      // Invalidar dashboard (top pizzas)
      cache.deletePattern('dashboard:top_pizzas:.*');
      
      // Invalidar relatórios de produtos
      cache.deletePattern('reports:top_products:.*');
      
      console.log('🧹 Auto-invalidated product-related caches');
    }
    
    return result;
  };
  
  next();
}

/**
 * Middleware genérico para invalidar todos os caches
 * Usado em operações críticas ou quando não há certeza das dependências
 */
function invalidateAllCaches(req, res, next) {
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.clear();
      console.log('🧹 Cleared all caches');
    }
    
    return result;
  };
  
  next();
}

/**
 * Middleware para log de estatísticas de cache
 * Útil para monitoramento e debug
 */
function logCacheStats(req, res, next) {
  const stats = cache.getStats();
  console.log(`📊 Cache Stats: ${stats.totalItems} items cached`);
  
  if (stats.totalItems > 0) {
    console.log(`📋 Cache Keys: ${stats.keys.join(', ')}`);
  }
  
  next();
}

module.exports = {
  invalidateOrderRelatedCaches,
  invalidateCashClosingRelatedCaches,
  invalidateCustomerRelatedCaches,
  invalidateProductRelatedCaches,
  invalidateAllCaches,
  logCacheStats
}; 