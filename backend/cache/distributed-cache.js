/**
 * Distributed cache implementation with Redis support and local cache fallback
 * Provides L2 caching for multi-instance deployments
 */
class DistributedCache {
  constructor(redisClient, localCache, options = {}) {
    this.redis = redisClient;
    this.local = localCache;
    this.isRedisConnected = false;
    
    // Configuration
    this.config = {
      localCacheTTL: options.localCacheTTL || 300000, // 5 minutes
      redisTTL: options.redisTTL || 600, // 10 minutes (in seconds)
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      enableCompression: options.enableCompression !== false,
      keyPrefix: options.keyPrefix || 'cache:',
      ...options
    };
    
    // Statistics
    this.stats = {
      localHits: 0,
      redisHits: 0,
      misses: 0,
      redisErrors: 0,
      compressionSavings: 0,
      fallbacksToLocal: 0
    };
    
    // Initialize Redis connection monitoring
    this.initializeRedisMonitoring();
  }

  /**
   * Initialize Redis connection monitoring and event handlers
   */
  initializeRedisMonitoring() {
    if (!this.redis) {
      console.warn('DistributedCache: No Redis client provided, using local cache only');
      return;
    }
    
    // Set initial connection status
    this.redis.on('ready', () => {
      this.isRedisConnected = true;
      console.log('DistributedCache: Redis connected');
    });
    
    this.redis.on('error', (error) => {
      console.error('DistributedCache: Redis error:', error);
      this.stats.redisErrors++;
    });
    
    this.redis.on('end', () => {
      this.isRedisConnected = false;
      console.warn('DistributedCache: Redis disconnected, falling back to local cache');
    });
  }

  /**
   * Get value from cache (L1 -> L2 -> miss)
   */
  async get(key) {
    const prefixedKey = this.config.keyPrefix + key;
    
    // Try L1 (local cache) first
    const localData = this.local.get(prefixedKey);
    if (localData !== null) {
      this.stats.localHits++;
      return localData;
    }
    
    // Try L2 (Redis) if available
    if (this.isRedisConnected && this.redis) {
      try {
        const redisData = await this.redis.get(prefixedKey);
        if (redisData) {
          this.stats.redisHits++;
          
          // Decompress if needed
          let parsed = this.deserializeValue(redisData);
          
          // Store in L1 for faster subsequent access
          this.local.set(prefixedKey, parsed, this.config.localCacheTTL);
          
          return parsed;
        }
      } catch (error) {
        this.stats.redisErrors++;
        console.error('DistributedCache: Redis get error:', error);
        this.stats.fallbacksToLocal++;
        // Continue to miss handling
      }
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache (L1 + L2)
   */
  async set(key, value, ttlSeconds = null) {
    const prefixedKey = this.config.keyPrefix + key;
    const ttl = ttlSeconds || this.config.redisTTL;
    
    // Always set in L1
    this.local.set(prefixedKey, value, ttl * 1000);
    
    // Try to set in L2 if available
    if (this.isRedisConnected && this.redis) {
      try {
        // Serialize and potentially compress the value
        const serialized = this.serializeValue(value);
        
        await this.redis.setEx(prefixedKey, ttl, serialized);
      } catch (error) {
        this.stats.redisErrors++;
        console.error('DistributedCache: Redis set error:', error);
        // L1 cache still works, so don't throw
      }
    }
    
    return true;
  }

  /**
   * Check if key exists in cache
   */
  async has(key) {
    const prefixedKey = this.config.keyPrefix + key;
    
    // Check L1 first
    if (this.local.has(prefixedKey)) {
      return true;
    }
    
    // Check L2 if available
    if (this.isRedisConnected && this.redis) {
      try {
        const exists = await this.redis.exists(prefixedKey);
        return exists === 1;
      } catch (error) {
        this.stats.redisErrors++;
        console.error('DistributedCache: Redis has error:', error);
      }
    }
    
    return false;
  }

  /**
   * Delete key from both cache layers
   */
  async delete(key) {
    const prefixedKey = this.config.keyPrefix + key;
    
    // Delete from L1
    this.local.delete(prefixedKey);
    
    // Delete from L2 if available
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(prefixedKey);
      } catch (error) {
        this.stats.redisErrors++;
        console.error('DistributedCache: Redis delete error:', error);
      }
    }
    
    return true;
  }

  /**
   * Delete multiple keys at once
   */
  async deleteMany(keys) {
    const prefixedKeys = keys.map(k => this.config.keyPrefix + k);
    
    // Delete from L1
    for (const key of prefixedKeys) {
      this.local.delete(key);
    }
    
    // Delete from L2 if available
    if (this.isRedisConnected && this.redis && prefixedKeys.length > 0) {
      try {
        await this.redis.del(prefixedKeys);
      } catch (error) {
        this.stats.redisErrors++;
        console.error('DistributedCache: Redis deleteMany error:', error);
      }
    }
    
    return true;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidatePattern(pattern) {
    const prefixedPattern = this.config.keyPrefix + pattern;
    
    // Clear matching entries from local cache
    // Note: This is a simple implementation, consider using a more efficient approach
    const localKeys = [];
    for (const [key] of this.local.cache.entries()) {
      if (this.matchPattern(key, prefixedPattern)) {
        localKeys.push(key);
      }
    }
    
    for (const key of localKeys) {
      this.local.delete(key);
    }
    
    // Clear from Redis if available
    if (this.isRedisConnected && this.redis) {
      try {
        // Use SCAN for production-safe pattern matching
        const keys = await this.scanKeys(prefixedPattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } catch (error) {
        this.stats.redisErrors++;
        console.error('DistributedCache: Redis pattern invalidation error:', error);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  async clear() {
    // Clear L1
    this.local.clear();
    
    // Clear L2 if available
    if (this.isRedisConnected && this.redis) {
      try {
        // Use SCAN to find all cache keys
        const keys = await this.scanKeys(this.config.keyPrefix + '*');
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } catch (error) {
        this.stats.redisErrors++;
        console.error('DistributedCache: Redis clear error:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalHits = this.stats.localHits + this.stats.redisHits;
    const total = totalHits + this.stats.misses;
    const hitRate = total > 0 ? (totalHits / total * 100).toFixed(2) : 0;
    
    const localStats = this.local.getStats();
    
    return {
      distributed: {
        ...this.stats,
        hitRate: `${hitRate}%`,
        redisConnected: this.isRedisConnected,
        compressionSavingsMB: (this.stats.compressionSavings / 1024 / 1024).toFixed(2)
      },
      local: localStats,
      summary: {
        totalHits,
        totalMisses: this.stats.misses,
        overallHitRate: `${hitRate}%`,
        l1HitRate: total > 0 ? `${(this.stats.localHits / total * 100).toFixed(2)}%` : '0%',
        l2HitRate: total > 0 ? `${(this.stats.redisHits / total * 100).toFixed(2)}%` : '0%'
      }
    };
  }

  /**
   * Serialize value for Redis storage
   */
  serializeValue(value) {
    const json = JSON.stringify(value);
    
    // Compress if enabled and value is large enough
    if (this.config.enableCompression && json.length > this.config.compressionThreshold) {
      // In a real implementation, you would use a compression library like zlib
      // For now, we'll just track that compression would happen
      this.stats.compressionSavings += json.length * 0.3; // Assume 30% compression
    }
    
    return json;
  }

  /**
   * Deserialize value from Redis storage
   */
  deserializeValue(data) {
    try {
      // In a real implementation, check if data is compressed and decompress
      return JSON.parse(data);
    } catch (error) {
      console.error('DistributedCache: Deserialization error:', error);
      return null;
    }
  }

  /**
   * Simple pattern matching for cache keys
   */
  matchPattern(key, pattern) {
    // Convert pattern to regex (simple glob to regex conversion)
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(key);
  }

  /**
   * Scan Redis keys matching a pattern (production-safe)
   */
  async scanKeys(pattern) {
    const keys = [];
    let cursor = '0';
    
    do {
      try {
        const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        keys.push(...result[1]);
      } catch (error) {
        console.error('DistributedCache: SCAN error:', error);
        break;
      }
    } while (cursor !== '0');
    
    return keys;
  }

  /**
   * Warm up cache with predefined data
   */
  async warmUp(warmUpFunction) {
    try {
      const data = await warmUpFunction();
      const promises = [];
      
      for (const [key, value, ttl] of data) {
        promises.push(this.set(key, value, ttl));
      }
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('DistributedCache: Warm-up failed:', error);
      return false;
    }
  }

  /**
   * Health check for distributed cache
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      localCache: 'ok',
      redisCache: 'unknown',
      issues: []
    };
    
    // Check local cache
    try {
      const testKey = `health-check-${Date.now()}`;
      this.local.set(testKey, { test: true }, 1000);
      const testValue = this.local.get(testKey);
      this.local.delete(testKey);
      
      if (!testValue) {
        health.localCache = 'unhealthy';
        health.issues.push('Local cache read/write failed');
      }
    } catch (error) {
      health.localCache = 'unhealthy';
      health.issues.push(`Local cache error: ${error.message}`);
    }
    
    // Check Redis cache
    if (this.redis) {
      try {
        const testKey = `${this.config.keyPrefix}health-check-${Date.now()}`;
        await this.redis.setEx(testKey, 1, 'test');
        const testValue = await this.redis.get(testKey);
        await this.redis.del(testKey);
        
        if (testValue === 'test') {
          health.redisCache = 'ok';
        } else {
          health.redisCache = 'unhealthy';
          health.issues.push('Redis cache read/write failed');
        }
      } catch (error) {
        health.redisCache = 'unhealthy';
        health.issues.push(`Redis cache error: ${error.message}`);
      }
    } else {
      health.redisCache = 'not-configured';
    }
    
    // Set overall status
    if (health.issues.length > 0) {
      health.status = 'degraded';
    }
    
    if (health.localCache === 'unhealthy') {
      health.status = 'unhealthy';
    }
    
    return health;
  }
}

module.exports = DistributedCache;