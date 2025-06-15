/**
 * Local in-memory cache with LRU eviction and memory limits
 * Provides fast L1 caching with automatic memory management
 */
class LocalCache {
  constructor(maxSize = 1000, defaultTTL = 900000, maxMemoryMB = 100) {
    this.cache = new Map();
    this.timers = new Map();
    this.accessOrder = new Map(); // For LRU tracking
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.maxMemoryBytes = maxMemoryMB * 1024 * 1024;
    this.estimatedMemoryUsage = 0;
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      memoryPressureEvictions: 0,
      errors: 0
    };
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Set a value in the cache with optional TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    try {
      // Estimate memory usage of the new value
      const valueSize = this.estimateSize(value);
      
      // Check memory limits before adding
      if (this.estimatedMemoryUsage + valueSize > this.maxMemoryBytes) {
        this.evictUntilMemoryAvailable(valueSize);
      }
      
      // Check size limits
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.evictOldest();
      }
      
      // Clear existing timer if updating existing key
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        // Subtract old value size from memory usage
        const oldValue = this.cache.get(key);
        if (oldValue) {
          this.estimatedMemoryUsage -= this.estimateSize(oldValue);
        }
      }
      
      // Store the value
      this.cache.set(key, {
        value,
        size: valueSize,
        createdAt: Date.now()
      });
      
      // Update memory usage
      this.estimatedMemoryUsage += valueSize;
      
      // Update access order for LRU
      this.accessOrder.set(key, Date.now());
      
      // Set expiration timer
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(key, true);
        }, ttl);
        this.timers.set(key, timer);
      }
      
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('LocalCache set error:', error);
      return false;
    }
  }

  /**
   * Get a value from the cache
   */
  get(key) {
    try {
      const entry = this.cache.get(key);
      
      if (entry) {
        this.stats.hits++;
        // Update access time for LRU
        this.accessOrder.set(key, Date.now());
        return entry.value;
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      console.error('LocalCache get error:', error);
      return null;
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache
   */
  delete(key, isExpiration = false) {
    try {
      const entry = this.cache.get(key);
      
      if (entry) {
        // Update memory usage
        this.estimatedMemoryUsage -= entry.size;
        
        // Clear timer
        if (this.timers.has(key)) {
          clearTimeout(this.timers.get(key));
          this.timers.delete(key);
        }
        
        // Remove from access order
        this.accessOrder.delete(key);
        
        // Remove from cache
        this.cache.delete(key);
        
        // Update stats
        if (isExpiration) {
          this.stats.expirations++;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      this.stats.errors++;
      console.error('LocalCache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
    this.accessOrder.clear();
    this.estimatedMemoryUsage = 0;
  }

  /**
   * Evict the least recently used item
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    // Find the least recently accessed key
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Evict entries until enough memory is available
   */
  evictUntilMemoryAvailable(requiredBytes) {
    const entries = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1]); // Sort by access time (oldest first)
    
    for (const [key] of entries) {
      if (this.estimatedMemoryUsage + requiredBytes <= this.maxMemoryBytes) {
        break;
      }
      
      this.delete(key);
      this.stats.memoryPressureEvictions++;
    }
  }

  /**
   * Estimate the memory size of a value in bytes
   */
  estimateSize(obj) {
    try {
      // Simple estimation based on JSON string length
      // This is not perfect but gives a reasonable approximation
      const str = JSON.stringify(obj);
      return str.length * 2; // 2 bytes per character (UTF-16)
    } catch (error) {
      // Fallback for non-serializable objects
      return 1024; // Default 1KB
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsageMB: (this.estimatedMemoryUsage / 1024 / 1024).toFixed(2),
      maxMemoryMB: (this.maxMemoryBytes / 1024 / 1024).toFixed(2),
      memoryUtilization: ((this.estimatedMemoryUsage / this.maxMemoryBytes) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Get detailed cache entries (for debugging)
   */
  getEntries() {
    const entries = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const accessTime = this.accessOrder.get(key);
      entries.push({
        key,
        size: entry.size,
        createdAt: new Date(entry.createdAt).toISOString(),
        lastAccessed: accessTime ? new Date(accessTime).toISOString() : null,
        age: Date.now() - entry.createdAt,
        hasTimer: this.timers.has(key)
      });
    }
    
    return entries.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  /**
   * Start periodic memory monitoring
   */
  startMemoryMonitoring() {
    // Check memory pressure every 30 seconds
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryPressure = usedMemory / totalMemory;
      
      // If memory pressure is high, evict more aggressively
      if (memoryPressure > 0.85) {
        const targetReduction = this.estimatedMemoryUsage * 0.2; // Reduce by 20%
        this.evictUntilMemoryAvailable(-targetReduction);
      }
    }, 30000);
  }

  /**
   * Warm up cache with predefined data
   */
  async warmUp(warmUpFunction) {
    try {
      const data = await warmUpFunction();
      for (const [key, value, ttl] of data) {
        this.set(key, value, ttl);
      }
      return true;
    } catch (error) {
      console.error('Cache warm-up failed:', error);
      return false;
    }
  }
}

module.exports = LocalCache;