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
      
      // Invalidar relatórios específicos por tipo
      cache.deletePattern(CacheKeys.PATTERNS.REPORTS_BY_TYPE);
      
      // Invalidar fechamento de caixa (dados do dia atual)
      cache.deletePattern(CacheKeys.PATTERNS.CASH_CLOSING_DETAILED);
      
      console.log('🧹 Auto-invalidated order-related caches (including type-specific)');
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
      
      // Invalidar fechamentos detalhados
      cache.deletePattern(CacheKeys.PATTERNS.CASH_CLOSING_DETAILED);
      
      // Invalidar dashboard e relatórios
      cache.deletePattern(CacheKeys.PATTERNS.DASHBOARD);
      cache.deletePattern(CacheKeys.PATTERNS.REPORTS);
      cache.deletePattern(CacheKeys.PATTERNS.REPORTS_BY_TYPE);
      
      console.log('🧹 Auto-invalidated cash closing-related caches (including detailed analysis)');
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
      
      // Invalidar relatórios de clientes (incluindo por tipo)
      cache.deletePattern('reports:customers:.*');
      cache.deletePattern('customers:by_type_preference:.*');
      
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
      
      // Invalidar relatórios de produtos (incluindo por tipo)
      cache.deletePattern('reports:top_products:.*');
      cache.deletePattern('reports:products_by_type:.*');
      cache.deletePattern('reports:comparative:.*');
      
      console.log('🧹 Auto-invalidated product-related caches (including type-specific)');
    }
    
    return result;
  };
  
  next();
}

/**
 * Middleware específico para invalidar caches relacionados a tipo de pedido
 * Usado quando alterações afetam especificamente a separação mesa vs delivery
 */
function invalidateOrderTypeRelatedCaches(req, res, next) {
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Invalidar caches específicos de tipo
      cache.deletePattern(CacheKeys.PATTERNS.REPORTS_BY_TYPE);
      cache.deletePattern('reports:comparative:.*');
      cache.deletePattern('cash_closing:.*detailed.*');
      
      // Invalidar pedidos por tipo
      cache.deletePattern('orders:type:.*');
      
      console.log('🧹 Auto-invalidated order type-specific caches');
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
 * Middleware para invalidar caches baseado no tipo de pedido modificado
 * Extrai o tipo do pedido da requisição para invalidação mais precisa
 */
function invalidateCachesByOrderType(req, res, next) {
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const { tipo_pedido } = req.body || {};
      
      if (tipo_pedido) {
        // Invalidar caches específicos do tipo
        cache.deletePattern(`.*:${tipo_pedido}:.*`);
        cache.deletePattern(`reports:.*_by_type:.*:${tipo_pedido}:.*`);
        
        console.log(`🧹 Auto-invalidated caches for order type: ${tipo_pedido}`);
      }
      
      // Sempre invalidar caches comparativos
      cache.deletePattern('reports:comparative:.*');
      cache.deletePattern(CacheKeys.PATTERNS.CASH_CLOSING_DETAILED);
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
    console.log(`📋 Cache Keys: ${stats.keys.slice(0, 5).join(', ')}${stats.keys.length > 5 ? '...' : ''}`);
  }
  
  next();
}

/**
 * Middleware para invalidação inteligente baseada no contexto
 * Analisa a rota e método para aplicar invalidação específica
 */
function smartCacheInvalidation(req, res, next) {
  const originalJson = res.json;
  res.json = function(...args) {
    const result = originalJson.apply(this, args);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const { method, path } = req;
      
      // Invalidação baseada na rota
      if (path.includes('/orders') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        invalidateOrderRelatedCaches._middleware?.(req, res, () => {});
      } else if (path.includes('/cash-closing') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        invalidateCashClosingRelatedCaches._middleware?.(req, res, () => {});
      } else if (path.includes('/customers') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        invalidateCustomerRelatedCaches._middleware?.(req, res, () => {});
      } else if (path.includes('/products') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        invalidateProductRelatedCaches._middleware?.(req, res, () => {});
      }
      
      console.log(`🤖 Smart cache invalidation applied for ${method} ${path}`);
    }
    
    return result;
  };
  
  next();
}

module.exports = {
  invalidateOrderRelatedCaches,
  invalidateCashClosingRelatedCaches,
  invalidateCustomerRelatedCaches,
  invalidateProductRelatedCaches,
  invalidateOrderTypeRelatedCaches,
  invalidateAllCaches,
  invalidateCachesByOrderType,
  logCacheStats,
  smartCacheInvalidation
}; 