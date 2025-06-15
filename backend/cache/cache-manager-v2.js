/**
 * Enhanced Cache Manager V2 - Integrates new robust cache system
 * Maintains backward compatibility while adding advanced features
 */

const CacheConfig = require('./cache-config');
const cacheMetrics = require('./cache-metrics');

class EnhancedCacheManager {
  constructor() {
    this.initialized = false;
    this.cache = null;
    this.invalidationManager = null;
    this.monitor = null;
    
    // Initialize async
    this.initPromise = this.initialize();
  }

  /**
   * Initialize the cache system
   */
  async initialize() {
    try {
      // Create cache based on environment
      const nodeEnv = process.env.NODE_ENV || 'development';
      
      if (nodeEnv === 'production') {
        this.cache = await CacheConfig.createProduction();
      } else {
        this.cache = await CacheConfig.createDevelopment();
      }
      
      // Initialize invalidation manager
      this.invalidationManager = this.cache.initializeInvalidation();
      
      // Get monitor if available
      this.monitor = this.cache.getMonitor();
      
      this.initialized = true;
      console.log('✅ Enhanced Cache Manager initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Cache Manager:', error);
      
      // Fallback to basic local cache
      this.cache = await CacheConfig.create({ strategy: 'local' });
      this.initialized = true;
      
      return false;
    }
  }

  /**
   * Ensure cache is initialized before operations
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  /**
   * Get value from cache (backward compatible)
   */
  async get(key) {
    await this.ensureInitialized();
    
    try {
      const value = await this.cache.get(key);
      
      // Maintain backward compatibility with metrics
      if (value !== null) {
        cacheMetrics.recordHit(key, 1);
        console.log(`🎯 Cache HIT: ${key}`);
      } else {
        cacheMetrics.recordMiss(key, 0);
        console.log(`❌ Cache MISS: ${key}`);
      }
      
      return value;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache (backward compatible)
   */
  async set(key, value, ttlSeconds = 300) {
    await this.ensureInitialized();
    
    try {
      await this.cache.set(key, value, ttlSeconds);
      cacheMetrics.recordSet(key);
      console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache (backward compatible)
   */
  async delete(key) {
    await this.ensureInitialized();
    
    try {
      await this.cache.delete(key);
      cacheMetrics.recordDelete(key);
      console.log(`🗑️ Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete by pattern (backward compatible)
   */
  async deletePattern(pattern) {
    await this.ensureInitialized();
    
    try {
      await this.cache.invalidatePattern(pattern);
      cacheMetrics.recordInvalidation(pattern, 0);
      console.log(`🗑️ Cache DELETE PATTERN: ${pattern}`);
      return true;
    } catch (error) {
      console.error(`Error deleting cache pattern ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache (backward compatible)
   */
  async clear() {
    await this.ensureInitialized();
    
    try {
      await this.cache.clear();
      console.log('🧹 Cache CLEAR: All items removed');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics (enhanced)
   */
  async getStats() {
    await this.ensureInitialized();
    
    const baseStats = this.cache.getStats();
    const legacyMetrics = cacheMetrics.getMetrics();
    
    // Combine new and legacy metrics
    return {
      ...baseStats,
      totalItems: baseStats.size || 0,
      keys: [], // Don't expose all keys for performance
      metrics: legacyMetrics,
      monitor: this.monitor ? await this.monitor.getHealthReport() : null
    };
  }

  /**
   * Cache-aside pattern helper (backward compatible)
   */
  async getOrFetch(key, dataFetcher, ttlSeconds = 300) {
    await this.ensureInitialized();
    
    // Try cache first
    const cachedData = await this.get(key);
    if (cachedData !== null) {
      return cachedData;
    }
    
    // Fetch from source
    try {
      const startTime = Date.now();
      const data = await dataFetcher();
      const dbResponseTime = Date.now() - startTime;
      
      // Update metrics
      cacheMetrics.recordMiss(key, dbResponseTime);
      
      // Store in cache
      await this.set(key, data, ttlSeconds);
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching data for cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Smart invalidation based on events
   */
  async invalidate(eventType, data) {
    await this.ensureInitialized();
    
    if (this.invalidationManager) {
      return await this.invalidationManager.invalidate(eventType, data);
    }
    
    // Fallback to pattern-based invalidation
    const patterns = this.getInvalidationPatterns(eventType, data);
    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  /**
   * Get invalidation patterns for events (fallback)
   */
  getInvalidationPatterns(eventType, data) {
    const patterns = [];
    
    switch (eventType) {
      case 'ORDER_CREATED':
      case 'ORDER_UPDATED':
        patterns.push('dashboard:*', 'financial:*', 'analytics:*');
        break;
      case 'PRODUCT_UPDATED':
        patterns.push('menu:*', 'products:*');
        break;
      case 'CUSTOMER_UPDATED':
        patterns.push('customers:*');
        break;
      default:
        patterns.push('*'); // Clear all on unknown events
    }
    
    return patterns;
  }

  /**
   * Generate performance report (enhanced)
   */
  async generatePerformanceReport() {
    await this.ensureInitialized();
    
    const legacyReport = cacheMetrics.generateReport();
    const monitorReport = this.monitor ? await this.monitor.getMetricsReport() : null;
    
    return {
      legacy: legacyReport,
      enhanced: monitorReport,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    cacheMetrics.reset();
    // New system tracks metrics internally
  }

  /**
   * Cleanup method (no-op as new system handles internally)
   */
  cleanup() {
    // New cache system handles cleanup automatically
    console.log('🧹 Cleanup handled by enhanced cache system');
  }

  /**
   * Setup event-based invalidation
   */
  setupEventInvalidation(eventEmitter) {
    if (this.invalidationManager) {
      this.invalidationManager.setupDatabaseTriggers(eventEmitter);
    }
  }

  /**
   * Warm up cache with predefined data
   */
  async warmUp(warmUpFunction) {
    await this.ensureInitialized();
    
    if (this.cache.warmUp) {
      return await this.cache.warmUp(warmUpFunction);
    }
    
    return false;
  }

  /**
   * Get monitor endpoints for Express app
   */
  setupMonitoringEndpoints(app) {
    if (this.monitor) {
      this.monitor.setupMetricsEndpoint(app);
    }
    
    // Also add backward compatible endpoints
    app.get('/api/cache/stats', async (req, res) => {
      const stats = await this.getStats();
      res.json(stats);
    });
    
    app.get('/api/cache/performance', async (req, res) => {
      const report = await this.generatePerformanceReport();
      res.json(report);
    });
  }
}

// Export singleton instance for backward compatibility
const enhancedCache = new EnhancedCacheManager();

// Also export the class for testing
enhancedCache.EnhancedCacheManager = EnhancedCacheManager;

module.exports = enhancedCache;