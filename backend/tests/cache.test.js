/**
 * Comprehensive unit tests for cache components
 * Run with: node tests/cache.test.js
 */
const LocalCache = require('../cache/local-cache');
const DistributedCache = require('../cache/distributed-cache');
const CacheInvalidationManager = require('../cache/cache-invalidation-manager');
const CacheMonitor = require('../cache/cache-monitor');
const CacheConfig = require('../cache/cache-config');

// Test utilities
class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(description, testFn) {
    this.tests.push({ description, testFn });
  }
  
  async run() {
    console.log(`\n=== Running ${this.name} ===\n`);
    
    for (const { description, testFn } of this.tests) {
      try {
        await testFn();
        this.passed++;
        console.log(`✓ ${description}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${description}`);
        console.error(`  Error: ${error.message}`);
      }
    }
    
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Assertion helpers
const assert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },
  
  notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected not ${expected}, got ${actual}`);
    }
  },
  
  ok(value, message) {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  },
  
  notOk(value, message) {
    if (value) {
      throw new Error(message || `Expected falsy value, got ${value}`);
    }
  },
  
  deepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Objects not equal: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
    }
  },
  
  includes(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(message || `Array does not include ${item}`);
    }
  }
};

// Mock Redis client for testing
class MockRedisClient {
  constructor() {
    this.data = new Map();
    this.connected = true;
    this.listeners = new Map();
  }
  
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    
    // Simulate immediate ready event
    if (event === 'ready') {
      setTimeout(() => handler(), 0);
    }
  }
  
  async get(key) {
    if (!this.connected) throw new Error('Redis not connected');
    return this.data.get(key) || null;
  }
  
  async setEx(key, ttl, value) {
    if (!this.connected) throw new Error('Redis not connected');
    this.data.set(key, value);
    setTimeout(() => this.data.delete(key), ttl * 1000);
  }
  
  async del(keys) {
    if (!this.connected) throw new Error('Redis not connected');
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => this.data.delete(key));
  }
  
  async exists(key) {
    if (!this.connected) throw new Error('Redis not connected');
    return this.data.has(key) ? 1 : 0;
  }
  
  async scan(cursor, ...args) {
    if (!this.connected) throw new Error('Redis not connected');
    const pattern = args[1];
    const keys = Array.from(this.data.keys()).filter(key => 
      key.match(new RegExp(pattern.replace(/\*/g, '.*')))
    );
    return ['0', keys];
  }
  
  simulateDisconnect() {
    this.connected = false;
    const handlers = this.listeners.get('end') || [];
    handlers.forEach(h => h());
  }
  
  simulateError(error) {
    const handlers = this.listeners.get('error') || [];
    handlers.forEach(h => h(error));
  }
}

// Test suites
async function runLocalCacheTests() {
  const runner = new TestRunner('LocalCache Tests');
  
  runner.test('should set and get values', async () => {
    const cache = new LocalCache(100, 60000, 10);
    cache.set('test-key', { value: 'test-data' });
    const result = cache.get('test-key');
    assert.deepEqual(result, { value: 'test-data' });
  });
  
  runner.test('should handle TTL expiration', async () => {
    const cache = new LocalCache(100, 100, 10); // 100ms TTL
    cache.set('expire-key', 'data', 100);
    assert.equal(cache.get('expire-key'), 'data');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(cache.get('expire-key'), null);
  });
  
  runner.test('should enforce size limits with LRU eviction', async () => {
    const cache = new LocalCache(3, 60000, 10);
    cache.set('key1', 'data1');
    cache.set('key2', 'data2');
    cache.set('key3', 'data3');
    
    // Access key1 to make it more recent
    cache.get('key1');
    
    // Adding key4 should evict key2 (least recently used)
    cache.set('key4', 'data4');
    
    assert.equal(cache.get('key1'), 'data1');
    assert.equal(cache.get('key2'), null); // Evicted
    assert.equal(cache.get('key3'), 'data3');
    assert.equal(cache.get('key4'), 'data4');
  });
  
  runner.test('should track statistics correctly', async () => {
    const cache = new LocalCache(100, 60000, 10);
    cache.set('key1', 'data1');
    cache.get('key1'); // Hit
    cache.get('key2'); // Miss
    cache.get('key1'); // Hit
    
    const stats = cache.getStats();
    assert.equal(stats.hits, 2);
    assert.equal(stats.misses, 1);
    assert.equal(stats.hitRate, '66.67%');
  });
  
  runner.test('should enforce memory limits', async () => {
    const cache = new LocalCache(1000, 60000, 0.001); // 1KB limit
    
    // Add large object
    const largeData = 'x'.repeat(1000);
    cache.set('large1', largeData);
    
    // Try to add another large object - should trigger eviction
    cache.set('large2', largeData);
    
    const stats = cache.getStats();
    assert.ok(stats.memoryPressureEvictions > 0);
  });
  
  runner.test('should handle deletion correctly', async () => {
    const cache = new LocalCache(100, 60000, 10);
    cache.set('delete-key', 'data');
    assert.equal(cache.get('delete-key'), 'data');
    
    cache.delete('delete-key');
    assert.equal(cache.get('delete-key'), null);
  });
  
  return runner.run();
}

async function runDistributedCacheTests() {
  const runner = new TestRunner('DistributedCache Tests');
  
  runner.test('should use local cache when Redis is not available', async () => {
    const localCache = new LocalCache(100, 60000, 10);
    const cache = new DistributedCache(null, localCache);
    
    await cache.set('test-key', { value: 'test-data' });
    const result = await cache.get('test-key');
    assert.deepEqual(result, { value: 'test-data' });
  });
  
  runner.test('should use Redis when available', async () => {
    const localCache = new LocalCache(100, 60000, 10);
    const redisClient = new MockRedisClient();
    const cache = new DistributedCache(redisClient, localCache);
    
    await new Promise(resolve => setTimeout(resolve, 10)); // Wait for ready event
    
    await cache.set('test-key', { value: 'test-data' });
    const result = await cache.get('test-key');
    assert.deepEqual(result, { value: 'test-data' });
    
    const stats = cache.getStats();
    assert.ok(stats.distributed.redisConnected);
  });
  
  runner.test('should fall back to local cache on Redis errors', async () => {
    const localCache = new LocalCache(100, 60000, 10);
    const redisClient = new MockRedisClient();
    const cache = new DistributedCache(redisClient, localCache);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Set value while Redis is connected
    await cache.set('fallback-key', 'data');
    
    // Simulate Redis disconnect
    redisClient.simulateDisconnect();
    
    // Should still get value from local cache
    const result = await cache.get('fallback-key');
    assert.equal(result, 'data');
    
    const stats = cache.getStats();
    assert.ok(stats.distributed.fallbacksToLocal > 0);
  });
  
  runner.test('should handle pattern invalidation', async () => {
    const localCache = new LocalCache(100, 60000, 10);
    const redisClient = new MockRedisClient();
    const cache = new DistributedCache(redisClient, localCache);
    
    await cache.set('user:1', 'data1');
    await cache.set('user:2', 'data2');
    await cache.set('order:1', 'order1');
    
    await cache.invalidatePattern('user:*');
    
    assert.equal(await cache.get('user:1'), null);
    assert.equal(await cache.get('user:2'), null);
    assert.equal(await cache.get('order:1'), 'order1');
  });
  
  runner.test('should track compression savings', async () => {
    const localCache = new LocalCache(100, 60000, 10);
    const redisClient = new MockRedisClient();
    const cache = new DistributedCache(redisClient, localCache, {
      enableCompression: true,
      compressionThreshold: 10
    });
    
    const largeData = { data: 'x'.repeat(100) };
    await cache.set('large-key', largeData);
    
    const stats = cache.getStats();
    assert.ok(parseFloat(stats.distributed.compressionSavingsMB) > 0);
  });
  
  runner.test('should perform health check correctly', async () => {
    const localCache = new LocalCache(100, 60000, 10);
    const redisClient = new MockRedisClient();
    const cache = new DistributedCache(redisClient, localCache);
    
    const health = await cache.healthCheck();
    assert.equal(health.status, 'healthy');
    assert.equal(health.localCache, 'ok');
    assert.equal(health.redisCache, 'ok');
  });
  
  return runner.run();
}

async function runInvalidationTests() {
  const runner = new TestRunner('CacheInvalidationManager Tests');
  
  runner.test('should invalidate based on events', async () => {
    const cache = {
      invalidatedKeys: [],
      async delete(key) {
        this.invalidatedKeys.push(key);
      },
      async invalidatePattern(pattern) {
        this.invalidatedKeys.push(pattern);
      }
    };
    
    const manager = new CacheInvalidationManager(cache);
    const result = await manager.invalidate('ORDER_CREATED', { date: '2025-01-15' });
    
    assert.includes(result.invalidatedKeys, 'dashboard:summary:2025-01-15');
    assert.includes(result.invalidatedKeys, 'financial:summary:2025-01-15');
  });
  
  runner.test('should handle dependencies', async () => {
    const cache = {
      deletedKeys: [],
      async delete(key) {
        this.deletedKeys.push(key);
      },
      async invalidatePattern(pattern) {
        this.deletedKeys.push(pattern);
      }
    };
    
    const manager = new CacheInvalidationManager(cache);
    manager.addDependency('parent-key', ['child-key1', 'child-key2']);
    
    await manager.invalidateKeys(['parent-key']);
    
    // Should invalidate dependent keys
    assert.includes(cache.deletedKeys, 'parent-key');
  });
  
  runner.test('should handle tag-based invalidation', async () => {
    const cache = {
      deletedKeys: [],
      async delete(key) {
        this.deletedKeys.push(key);
      },
      async invalidatePattern(pattern) {
        this.deletedKeys.push(pattern);
      }
    };
    
    const manager = new CacheInvalidationManager(cache);
    manager.addTag('key1', 'user-data');
    manager.addTag('key2', 'user-data');
    manager.addTag('key3', 'order-data');
    
    await manager.invalidateTag('user-data');
    
    assert.includes(cache.deletedKeys, 'key1');
    assert.includes(cache.deletedKeys, 'key2');
    assert.notOk(cache.deletedKeys.includes('key3'));
  });
  
  runner.test('should handle custom rules', async () => {
    const cache = {
      deletedKeys: [],
      async delete(key) {
        this.deletedKeys.push(key);
      },
      async invalidatePattern(pattern) {
        this.deletedKeys.push(pattern);
      }
    };
    
    const manager = new CacheInvalidationManager(cache);
    manager.addRule('CUSTOM_EVENT', (data) => [
      `custom:${data.id}`,
      `related:${data.type}`
    ]);
    
    await manager.invalidate('CUSTOM_EVENT', { id: '123', type: 'test' });
    
    assert.includes(cache.deletedKeys, 'custom:123');
    assert.includes(cache.deletedKeys, 'related:test');
  });
  
  runner.test('should track statistics', async () => {
    const cache = {
      async delete() {},
      async invalidatePattern() {}
    };
    
    const manager = new CacheInvalidationManager(cache);
    await manager.invalidate('ORDER_CREATED', { date: '2025-01-15' });
    
    const stats = manager.getStats();
    assert.ok(stats.invalidations > 0);
    assert.ok(stats.ruleBasedInvalidations > 0);
  });
  
  return runner.run();
}

async function runMonitorTests() {
  const runner = new TestRunner('CacheMonitor Tests');
  
  runner.test('should track operations', async () => {
    const cache = {
      getStats() {
        return { hitRate: '85%', size: 100 };
      }
    };
    
    const monitor = new CacheMonitor(cache, { enableAutoLogging: false });
    monitor.recordOperation('get', 'test-key', true, 10);
    monitor.recordOperation('get', 'test-key2', false, 15);
    
    const health = await monitor.getHealthReport();
    assert.equal(health.status, 'healthy');
    assert.ok(health.performance.avgResponseTimeMs > 0);
  });
  
  runner.test('should generate alerts', async () => {
    const cache = {
      getStats() {
        return { hitRate: '50%', size: 100 }; // Low hit rate
      }
    };
    
    const monitor = new CacheMonitor(cache, {
      enableAutoLogging: false,
      alertThresholds: { hitRate: 70 }
    });
    
    monitor.recordOperation('get', 'key1', false, 10);
    monitor.recordOperation('get', 'key2', false, 10);
    
    const health = await monitor.getHealthReport();
    assert.ok(health.alerts.length > 0);
    assert.equal(health.alerts[0].type, 'LOW_HIT_RATE');
  });
  
  runner.test('should calculate percentiles', async () => {
    const cache = {
      getStats() {
        return { hitRate: '85%', size: 100 };
      }
    };
    
    const monitor = new CacheMonitor(cache, { enableAutoLogging: false });
    
    // Record operations with different durations
    for (let i = 1; i <= 100; i++) {
      monitor.recordOperation('get', `key${i}`, true, i);
    }
    
    const metrics = monitor.getMetricsReport();
    assert.ok(metrics.performance.percentiles.p50);
    assert.ok(metrics.performance.percentiles.p95);
  });
  
  runner.test('should track category statistics', async () => {
    const cache = {
      getStats() {
        return { hitRate: '85%', size: 100 };
      }
    };
    
    const monitor = new CacheMonitor(cache, { enableAutoLogging: false });
    
    monitor.recordOperation('get', 'order:123', true, 10);
    monitor.recordOperation('get', 'order:456', false, 20);
    monitor.recordOperation('get', 'product:789', true, 5);
    
    const metrics = monitor.getMetricsReport();
    assert.ok(metrics.categories.order);
    assert.ok(metrics.categories.product);
    assert.equal(metrics.categories.order.count, 2);
    assert.equal(metrics.categories.product.count, 1);
  });
  
  runner.test('should format uptime correctly', async () => {
    const cache = {
      getStats() {
        return { hitRate: '85%', size: 100 };
      }
    };
    
    const monitor = new CacheMonitor(cache, { enableAutoLogging: false });
    monitor.startTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    
    const health = await monitor.getHealthReport();
    assert.ok(health.uptime.formatted.includes('1d'));
  });
  
  return runner.run();
}

async function runConfigTests() {
  const runner = new TestRunner('CacheConfig Tests');
  
  runner.test('should create local cache by default', async () => {
    const cache = await CacheConfig.create({ strategy: 'local' });
    assert.ok(cache);
    assert.ok(cache._cache instanceof LocalCache);
  });
  
  runner.test('should apply TTL based on key patterns', async () => {
    const cache = await CacheConfig.create({
      strategy: 'local',
      ttlConfig: {
        dashboard: 300,
        financial: 600
      }
    });
    
    assert.equal(cache._getTTLForKey('dashboard:summary'), 300);
    assert.equal(cache._getTTLForKey('financial:report'), 600);
  });
  
  runner.test('should initialize monitoring when enabled', async () => {
    const cache = await CacheConfig.create({
      strategy: 'local',
      monitoring: { enabled: true }
    });
    
    assert.ok(cache.getMonitor());
  });
  
  runner.test('should get recommended config', () => {
    const config = CacheConfig.getRecommendedConfig();
    assert.ok(config.localMaxSize > 0);
    assert.ok(config.localMaxMemoryMB > 0);
    assert.ok(config.strategy);
  });
  
  runner.test('should wrap cache methods with monitoring', async () => {
    const cache = await CacheConfig.create({
      strategy: 'local',
      monitoring: { enabled: true }
    });
    
    await cache.set('monitor-test', 'data');
    const value = await cache.get('monitor-test');
    
    assert.equal(value, 'data');
    
    const monitor = cache.getMonitor();
    const health = await monitor.getHealthReport();
    assert.ok(health.performance.recentOperations > 0);
  });
  
  return runner.run();
}

// Main test runner
async function runAllTests() {
  console.log('Starting Cache Component Tests...');
  
  const results = await Promise.all([
    runLocalCacheTests(),
    runDistributedCacheTests(),
    runInvalidationTests(),
    runMonitorTests(),
    runConfigTests()
  ]);
  
  const allPassed = results.every(r => r);
  
  console.log('\n=== Test Summary ===');
  console.log(allPassed ? '✓ All tests passed!' : '✗ Some tests failed');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});