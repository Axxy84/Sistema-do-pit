/**
 * Sistema de Métricas de Cache
 * Monitora performance e eficiência do cache implementado
 */

class CacheMetrics {
  constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      
      // Métricas por categoria
      categoryMetrics: {
        products: { hits: 0, misses: 0, avgResponseTime: 0 },
        customers: { hits: 0, misses: 0, avgResponseTime: 0 },
        deliverers: { hits: 0, misses: 0, avgResponseTime: 0 },
        orders: { hits: 0, misses: 0, avgResponseTime: 0 },
        dashboard: { hits: 0, misses: 0, avgResponseTime: 0 }
      },
      
      // Histórico por hora
      hourlyStats: new Map(),
      
      // Performance tracking
      responseTimes: [],
      cacheResponseTimes: [],
      dbResponseTimes: []
    };
    
    this.startTime = Date.now();
  }

  /**
   * Registra um cache hit
   */
  recordHit(key, responseTime = 0) {
    this.metrics.hits++;
    this.metrics.cacheResponseTimes.push(responseTime);
    
    const category = this.getCategoryFromKey(key);
    if (category && this.metrics.categoryMetrics[category]) {
      this.metrics.categoryMetrics[category].hits++;
      this.updateAvgResponseTime(category, responseTime);
    }
    
    this.updateHourlyStats('hits');
    console.log(`📈 Cache Metrics: HIT for ${key} (${responseTime}ms)`);
  }

  /**
   * Registra um cache miss
   */
  recordMiss(key, responseTime = 0) {
    this.metrics.misses++;
    this.metrics.dbResponseTimes.push(responseTime);
    
    const category = this.getCategoryFromKey(key);
    if (category && this.metrics.categoryMetrics[category]) {
      this.metrics.categoryMetrics[category].misses++;
      this.updateAvgResponseTime(category, responseTime);
    }
    
    this.updateHourlyStats('misses');
    console.log(`📉 Cache Metrics: MISS for ${key} (${responseTime}ms)`);
  }

  /**
   * Registra uma operação de set
   */
  recordSet(key) {
    this.metrics.sets++;
    this.updateHourlyStats('sets');
  }

  /**
   * Registra uma operação de delete
   */
  recordDelete(key) {
    this.metrics.deletes++;
    this.updateHourlyStats('deletes');
  }

  /**
   * Registra uma invalidação de cache
   */
  recordInvalidation(pattern, count = 1) {
    this.metrics.invalidations += count;
    this.updateHourlyStats('invalidations', count);
    console.log(`💥 Cache Metrics: INVALIDATION pattern ${pattern} (${count} items)`);
  }

  /**
   * Extrai categoria da chave de cache
   */
  getCategoryFromKey(key) {
    if (key.startsWith('products:')) return 'products';
    if (key.startsWith('customers:')) return 'customers';
    if (key.startsWith('deliverers:')) return 'deliverers';
    if (key.startsWith('orders:')) return 'orders';
    if (key.startsWith('dashboard:')) return 'dashboard';
    return null;
  }

  /**
   * Atualiza tempo médio de resposta por categoria
   */
  updateAvgResponseTime(category, responseTime) {
    const current = this.metrics.categoryMetrics[category].avgResponseTime;
    const total = this.metrics.categoryMetrics[category].hits + this.metrics.categoryMetrics[category].misses;
    
    if (total === 1) {
      this.metrics.categoryMetrics[category].avgResponseTime = responseTime;
    } else {
      // Média móvel simples
      this.metrics.categoryMetrics[category].avgResponseTime = 
        ((current * (total - 1)) + responseTime) / total;
    }
  }

  /**
   * Atualiza estatísticas horárias
   */
  updateHourlyStats(type, count = 1) {
    const hour = new Date().getHours();
    if (!this.metrics.hourlyStats.has(hour)) {
      this.metrics.hourlyStats.set(hour, {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        invalidations: 0
      });
    }
    
    this.metrics.hourlyStats.get(hour)[type] += count;
  }

  /**
   * Calcula taxa de acerto do cache
   */
  getHitRate() {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? (this.metrics.hits / total * 100).toFixed(2) : 0;
  }

  /**
   * Calcula economia de tempo com cache
   */
  getTimeSavings() {
    const avgCacheTime = this.metrics.cacheResponseTimes.length > 0 ?
      this.metrics.cacheResponseTimes.reduce((a, b) => a + b, 0) / this.metrics.cacheResponseTimes.length : 0;
    
    const avgDbTime = this.metrics.dbResponseTimes.length > 0 ?
      this.metrics.dbResponseTimes.reduce((a, b) => a + b, 0) / this.metrics.dbResponseTimes.length : 0;
    
    const timeSaved = avgDbTime - avgCacheTime;
    const totalRequests = this.metrics.hits;
    
    return {
      avgCacheTime: Math.round(avgCacheTime),
      avgDbTime: Math.round(avgDbTime),
      timeSavedPerRequest: Math.round(timeSaved),
      totalTimeSaved: Math.round(timeSaved * totalRequests),
      percentageImprovement: avgDbTime > 0 ? ((timeSaved / avgDbTime) * 100).toFixed(1) : 0
    };
  }

  /**
   * Retorna métricas consolidadas
   */
  getMetrics() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    const hitRate = this.getHitRate();
    const timeSavings = this.getTimeSavings();
    
    return {
      summary: {
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        hitRate: `${hitRate}%`,
        totalRequests: this.metrics.hits + this.metrics.misses,
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        sets: this.metrics.sets,
        deletes: this.metrics.deletes,
        invalidations: this.metrics.invalidations
      },
      
      performance: {
        avgCacheResponseTime: `${timeSavings.avgCacheTime}ms`,
        avgDbResponseTime: `${timeSavings.avgDbTime}ms`,
        timeSavedPerRequest: `${timeSavings.timeSavedPerRequest}ms`,
        totalTimeSaved: `${timeSavings.totalTimeSaved}ms`,
        performanceImprovement: `${timeSavings.percentageImprovement}%`
      },
      
      categoryBreakdown: Object.entries(this.metrics.categoryMetrics).map(([category, stats]) => ({
        category,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits + stats.misses > 0 ? 
          ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) + '%' : '0%',
        avgResponseTime: Math.round(stats.avgResponseTime) + 'ms'
      })),
      
      hourlyDistribution: Array.from(this.metrics.hourlyStats.entries()).map(([hour, stats]) => ({
        hour: `${hour}:00`,
        ...stats
      }))
    };
  }

  /**
   * Gera relatório de performance
   */
  generateReport() {
    const metrics = this.getMetrics();
    
    console.log('\n🎯 ===== CACHE PERFORMANCE REPORT =====');
    console.log(`⏱️  Uptime: ${metrics.summary.uptime}`);
    console.log(`🎯 Hit Rate: ${metrics.summary.hitRate}`);
    console.log(`📊 Total Requests: ${metrics.summary.totalRequests}`);
    console.log(`✅ Cache Hits: ${metrics.summary.hits}`);
    console.log(`❌ Cache Misses: ${metrics.summary.misses}`);
    console.log(`💾 Cache Sets: ${metrics.summary.sets}`);
    console.log(`🗑️  Cache Deletes: ${metrics.summary.deletes}`);
    console.log(`💥 Invalidations: ${metrics.summary.invalidations}`);
    
    console.log('\n🚀 PERFORMANCE IMPACT:');
    console.log(`⚡ Cache Response Time: ${metrics.performance.avgCacheResponseTime}`);
    console.log(`🐌 DB Response Time: ${metrics.performance.avgDbResponseTime}`);
    console.log(`💰 Time Saved/Request: ${metrics.performance.timeSavedPerRequest}`);
    console.log(`🎉 Total Time Saved: ${metrics.performance.totalTimeSaved}`);
    console.log(`📈 Performance Improvement: ${metrics.performance.performanceImprovement}`);
    
    console.log('\n📋 BREAKDOWN BY CATEGORY:');
    metrics.categoryBreakdown.forEach(cat => {
      if (cat.hits + cat.misses > 0) {
        console.log(`   ${cat.category}: ${cat.hitRate} hit rate (${cat.avgResponseTime})`);
      }
    });
    
    console.log('\n=======================================\n');
    
    return metrics;
  }

  /**
   * Reseta métricas
   */
  reset() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      categoryMetrics: {
        products: { hits: 0, misses: 0, avgResponseTime: 0 },
        customers: { hits: 0, misses: 0, avgResponseTime: 0 },
        deliverers: { hits: 0, misses: 0, avgResponseTime: 0 },
        orders: { hits: 0, misses: 0, avgResponseTime: 0 },
        dashboard: { hits: 0, misses: 0, avgResponseTime: 0 }
      },
      hourlyStats: new Map(),
      responseTimes: [],
      cacheResponseTimes: [],
      dbResponseTimes: []
    };
    this.startTime = Date.now();
    console.log('🧹 Cache metrics reset');
  }
}

// Instância única de métricas
const cacheMetrics = new CacheMetrics();

module.exports = cacheMetrics;