/**
 * Adaptive cache configuration system
 * Supports multiple strategies and external cache providers
 */
const LocalCache = require('./local-cache');
const DistributedCache = require('./distributed-cache');
const CacheInvalidationManager = require('./cache-invalidation-manager');
const CacheMonitor = require('./cache-monitor');

class CacheConfig {
  /**
   * Create cache instance based on environment configuration
   */
  static async create(options = {}) {
    const strategy = process.env.CACHE_STRATEGY || options.strategy || 'hybrid';
    const config = this.loadConfiguration(options);
    
    console.log(`Initializing cache with strategy: ${strategy}`);
    
    let cacheInstance;
    
    switch (strategy) {
      case 'local':
        cacheInstance = this.createLocalCache(config);
        break;
        
      case 'redis':
        cacheInstance = await this.createRedisCache(config);
        break;
        
      case 'hybrid':
      default:
        cacheInstance = await this.createHybridCache(config);
        break;
    }
    
    // Wrap with monitoring and invalidation
    return this.wrapWithEnhancements(cacheInstance, config);
  }
  
  /**
   * Load configuration from environment and options
   */
  static loadConfiguration(options) {
    return {
      // Local cache config
      localCache: {
        maxSize: parseInt(process.env.L1_CACHE_SIZE) || options.localMaxSize || 1000,
        defaultTTL: (parseInt(process.env.DEFAULT_TTL_SECONDS) || 600) * 1000,
        maxMemoryMB: parseInt(process.env.L1_CACHE_MEMORY_MB) || options.localMaxMemoryMB || 100
      },
      
      // Redis config
      redis: {
        url: process.env.REDIS_URL || options.redisUrl,
        host: process.env.REDIS_HOST || options.redisHost || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || options.redisPort || 6379,
        password: process.env.REDIS_PASSWORD || options.redisPassword,
        db: parseInt(process.env.REDIS_DB) || options.redisDb || 0,
        keyPrefix: process.env.CACHE_KEY_PREFIX || options.keyPrefix || 'cache:',
        enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
        compressionThreshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
      },
      
      // Monitoring config
      monitoring: {
        enabled: process.env.ENABLE_CACHE_METRICS !== 'false',
        metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 300000,
        alertThresholds: {
          hitRate: parseInt(process.env.ALERT_HIT_RATE) || 70,
          errorRate: parseInt(process.env.ALERT_ERROR_RATE) || 5,
          memoryUsage: parseInt(process.env.ALERT_MEMORY_USAGE) || 90,
          responseTime: parseInt(process.env.ALERT_RESPONSE_TIME) || 500
        }
      },
      
      // TTL configurations by data type
      ttlConfig: {
        dashboard: parseInt(process.env.TTL_DASHBOARD) || 300, // 5 minutes
        financial: parseInt(process.env.TTL_FINANCIAL) || 600, // 10 minutes
        orders: parseInt(process.env.TTL_ORDERS) || 900, // 15 minutes
        products: parseInt(process.env.TTL_PRODUCTS) || 3600, // 1 hour
        customers: parseInt(process.env.TTL_CUSTOMERS) || 900, // 15 minutes
        reports: parseInt(process.env.TTL_REPORTS) || 1800, // 30 minutes
        menu: parseInt(process.env.TTL_MENU) || 3600, // 1 hour
        analytics: parseInt(process.env.TTL_ANALYTICS) || 600 // 10 minutes
      },
      
      // Feature flags
      features: {
        enableWarmup: process.env.ENABLE_CACHE_WARMUP === 'true',
        enablePredictiveInvalidation: process.env.ENABLE_PREDICTIVE_INVALIDATION === 'true',
        enableAutoScaling: process.env.ENABLE_CACHE_AUTOSCALING === 'true'
      },
      
      ...options
    };
  }
  
  /**
   * Create local-only cache
   */
  static createLocalCache(config) {
    return new LocalCache(
      config.localCache.maxSize,
      config.localCache.defaultTTL,
      config.localCache.maxMemoryMB
    );
  }
  
  /**
   * Create Redis-only cache
   */
  static async createRedisCache(config) {
    const redis = await this.createRedisClient(config.redis);
    
    // Create a minimal local cache for Redis-only mode
    const minimalLocal = new LocalCache(100, 60000, 10); // Small, short-lived
    
    return new DistributedCache(redis, minimalLocal, {
      localCacheTTL: 60000, // 1 minute local cache
      redisTTL: config.redis.defaultTTL || 600,
      compressionThreshold: config.redis.compressionThreshold,
      enableCompression: config.redis.enableCompression,
      keyPrefix: config.redis.keyPrefix
    });
  }
  
  /**
   * Create hybrid cache (local + Redis)
   */
  static async createHybridCache(config) {
    const localCache = this.createLocalCache(config);
    
    let redisClient = null;
    if (config.redis.url || config.redis.host) {
      try {
        redisClient = await this.createRedisClient(config.redis);
      } catch (error) {
        console.warn('Failed to connect to Redis, falling back to local-only cache:', error.message);
      }
    }
    
    return new DistributedCache(redisClient, localCache, {
      localCacheTTL: config.localCache.defaultTTL,
      redisTTL: config.redis.defaultTTL || 600,
      compressionThreshold: config.redis.compressionThreshold,
      enableCompression: config.redis.enableCompression,
      keyPrefix: config.redis.keyPrefix
    });
  }
  
  /**
   * Create Redis client with configuration
   */
  static async createRedisClient(redisConfig) {
    // Check if redis module is available
    let redis;
    try {
      redis = require('redis');
    } catch (error) {
      console.warn('Redis module not installed. Run "npm install redis" to enable Redis caching.');
      return null;
    }
    
    const client = redis.createClient({
      url: redisConfig.url,
      socket: {
        host: redisConfig.host,
        port: redisConfig.port
      },
      password: redisConfig.password,
      database: redisConfig.db,
      lazyConnect: false
    });
    
    // Error handling
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    // Connect to Redis
    await client.connect();
    
    return client;
  }
  
  /**
   * Wrap cache with monitoring and invalidation capabilities
   */
  static wrapWithEnhancements(cache, config) {
    // Create enhanced cache wrapper
    const enhancedCache = {
      // Original cache instance
      _cache: cache,
      _config: config,
      _monitor: null,
      _invalidationManager: null,
      
      // Wrap get method with monitoring
      async get(key) {
        const start = Date.now();
        let hit = false;
        let error = null;
        
        try {
          const value = await this._cache.get(key);
          hit = value !== null;
          
          if (this._monitor) {
            this._monitor.recordOperation('get', key, hit, Date.now() - start);
          }
          
          return value;
        } catch (err) {
          error = err;
          if (this._monitor) {
            this._monitor.recordOperation('get', key, false, Date.now() - start, error);
          }
          throw err;
        }
      },
      
      // Wrap set method with monitoring
      async set(key, value, ttl) {
        const start = Date.now();
        let error = null;
        
        // Determine TTL based on key pattern
        const finalTTL = ttl || this._getTTLForKey(key);
        
        try {
          await this._cache.set(key, value, finalTTL);
          
          if (this._monitor) {
            this._monitor.recordOperation('set', key, true, Date.now() - start);
          }
          
          return true;
        } catch (err) {
          error = err;
          if (this._monitor) {
            this._monitor.recordOperation('set', key, false, Date.now() - start, error);
          }
          throw err;
        }
      },
      
      // Wrap delete method
      async delete(key) {
        const start = Date.now();
        
        try {
          await this._cache.delete(key);
          
          if (this._monitor) {
            this._monitor.recordOperation('delete', key, true, Date.now() - start);
          }
          
          return true;
        } catch (err) {
          if (this._monitor) {
            this._monitor.recordOperation('delete', key, false, Date.now() - start, err);
          }
          throw err;
        }
      },
      
      // Expose other cache methods
      async has(key) {
        return this._cache.has(key);
      },
      
      async clear() {
        return this._cache.clear();
      },
      
      async invalidatePattern(pattern) {
        return this._cache.invalidatePattern(pattern);
      },
      
      async deleteMany(keys) {
        return this._cache.deleteMany(keys);
      },
      
      getStats() {
        return this._cache.getStats();
      },
      
      // Get TTL based on key pattern
      _getTTLForKey(key) {
        const ttlConfig = this._config.ttlConfig;
        
        if (key.startsWith('dashboard:')) return ttlConfig.dashboard;
        if (key.startsWith('financial:')) return ttlConfig.financial;
        if (key.startsWith('order:') || key.startsWith('orders:')) return ttlConfig.orders;
        if (key.startsWith('product:') || key.startsWith('products:')) return ttlConfig.products;
        if (key.startsWith('customer:') || key.startsWith('customers:')) return ttlConfig.customers;
        if (key.startsWith('report:') || key.startsWith('reports:')) return ttlConfig.reports;
        if (key.startsWith('menu:')) return ttlConfig.menu;
        if (key.startsWith('analytics:')) return ttlConfig.analytics;
        
        return this._config.localCache.defaultTTL / 1000; // Default TTL in seconds
      },
      
      // Initialize monitoring
      initializeMonitoring() {
        if (this._config.monitoring.enabled && !this._monitor) {
          this._monitor = new CacheMonitor(this._cache, this._config.monitoring);
        }
        return this._monitor;
      },
      
      // Initialize invalidation manager
      initializeInvalidation() {
        if (!this._invalidationManager) {
          this._invalidationManager = new CacheInvalidationManager(this);
        }
        return this._invalidationManager;
      },
      
      // Get monitor instance
      getMonitor() {
        return this._monitor;
      },
      
      // Get invalidation manager
      getInvalidationManager() {
        return this._invalidationManager;
      },
      
      // Warm up cache
      async warmUp(warmUpFunction) {
        if (this._cache.warmUp) {
          return this._cache.warmUp(warmUpFunction);
        }
        return false;
      }
    };
    
    // Initialize monitoring if enabled
    if (config.monitoring.enabled) {
      enhancedCache.initializeMonitoring();
    }
    
    return enhancedCache;
  }
  
  /**
   * Create cache instance with sensible defaults for production
   */
  static async createProduction() {
    return this.create({
      strategy: 'hybrid',
      localMaxSize: 5000,
      localMaxMemoryMB: 200,
      monitoring: {
        enabled: true,
        alertThresholds: {
          hitRate: 80,
          errorRate: 2,
          memoryUsage: 85,
          responseTime: 200
        }
      }
    });
  }
  
  /**
   * Create cache instance optimized for development
   */
  static async createDevelopment() {
    return this.create({
      strategy: 'local',
      localMaxSize: 500,
      localMaxMemoryMB: 50,
      monitoring: {
        enabled: true,
        metricsInterval: 60000 // 1 minute
      }
    });
  }
  
  /**
   * Get recommended cache configuration based on system resources
   */
  static getRecommendedConfig() {
    const totalMemory = require('os').totalmem();
    const availableMemory = require('os').freemem();
    const cpuCount = require('os').cpus().length;
    
    // Calculate recommended cache size based on available resources
    const recommendedMemoryMB = Math.min(
      Math.floor(availableMemory / 1024 / 1024 * 0.1), // 10% of available memory
      500 // Max 500MB for cache
    );
    
    const recommendedMaxSize = Math.min(
      cpuCount * 1000, // 1000 entries per CPU
      10000 // Max 10k entries
    );
    
    return {
      localMaxSize: recommendedMaxSize,
      localMaxMemoryMB: recommendedMemoryMB,
      strategy: totalMemory > 4 * 1024 * 1024 * 1024 ? 'hybrid' : 'local' // Use hybrid for >4GB RAM
    };
  }
}

module.exports = CacheConfig;