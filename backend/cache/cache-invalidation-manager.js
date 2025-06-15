/**
 * Smart cache invalidation manager with dependency tracking
 * Handles event-based invalidation and cascading updates
 */
class CacheInvalidationManager {
  constructor(cache) {
    this.cache = cache;
    this.dependencies = new Map();
    this.tags = new Map();
    this.invalidationRules = new Map();
    
    // Statistics
    this.stats = {
      invalidations: 0,
      cascadeInvalidations: 0,
      tagInvalidations: 0,
      ruleBasedInvalidations: 0,
      errors: 0
    };
    
    // Initialize default invalidation rules
    this.initializeDefaultRules();
  }

  /**
   * Initialize default invalidation rules for common events
   */
  initializeDefaultRules() {
    // Order-related invalidation rules
    this.addRule('ORDER_CREATED', (data) => {
      const date = this.extractDate(data.date);
      return [
        `dashboard:summary:${date}`,
        `dashboard:kpis:${date}`,
        `financial:summary:${date}`,
        `analytics:orders:${date}`,
        `reports:daily:${date}`,
        'dashboard:recent-orders',
        'analytics:top-products'
      ];
    });

    this.addRule('ORDER_UPDATED', (data) => {
      const date = this.extractDate(data.date);
      const patterns = [
        `order:${data.id}`,
        `dashboard:summary:${date}`,
        `financial:summary:${date}`,
        'dashboard:recent-orders'
      ];
      
      // If status changed, invalidate status-specific caches
      if (data.statusChanged) {
        patterns.push(`orders:status:${data.oldStatus}`);
        patterns.push(`orders:status:${data.newStatus}`);
      }
      
      return patterns;
    });

    this.addRule('ORDER_DELIVERED', (data) => {
      const date = this.extractDate(data.date);
      return [
        `order:${data.id}`,
        `deliveries:pending`,
        `deliveries:completed:${date}`,
        `deliverer:${data.delivererId}:stats`,
        `dashboard:delivery-metrics:${date}`
      ];
    });

    // Financial events
    this.addRule('EXPENSE_CREATED', (data) => {
      const date = this.extractDate(data.date);
      return [
        `financial:summary:${date}`,
        `expenses:category:${data.category}:${date}`,
        `reports:profit-loss:${date}`,
        `owner:analytics:${date}`
      ];
    });

    this.addRule('CASH_CLOSING_CREATED', (data) => {
      const date = this.extractDate(data.date);
      return [
        `cash-closing:${date}`,
        `financial:summary:${date}`,
        `reports:daily:${date}`,
        'cash-closing:recent'
      ];
    });

    // Product/Menu events
    this.addRule('PRODUCT_UPDATED', (data) => {
      return [
        `product:${data.id}`,
        `products:category:${data.category}`,
        'menu:all',
        'menu:pizzas',
        'menu:active'
      ];
    });

    this.addRule('MENU_UPDATED', () => {
      return ['menu:*', 'products:*', 'pricing:*'];
    });

    // Customer events
    this.addRule('CUSTOMER_UPDATED', (data) => {
      return [
        `customer:${data.id}`,
        `customer:phone:${data.phone}`,
        'customers:recent',
        'customers:top-spenders'
      ];
    });

    // Batch operations
    this.addRule('BATCH_ORDERS_UPDATE', (data) => {
      const dates = new Set(data.orders.map(o => this.extractDate(o.date)));
      const patterns = [];
      
      for (const date of dates) {
        patterns.push(
          `dashboard:summary:${date}`,
          `financial:summary:${date}`,
          `analytics:orders:${date}`
        );
      }
      
      return patterns;
    });
  }

  /**
   * Register cache key dependencies
   */
  addDependency(cacheKey, dependentKeys) {
    if (!this.dependencies.has(cacheKey)) {
      this.dependencies.set(cacheKey, new Set());
    }
    
    const deps = this.dependencies.get(cacheKey);
    if (Array.isArray(dependentKeys)) {
      dependentKeys.forEach(key => deps.add(key));
    } else {
      deps.add(dependentKeys);
    }
  }

  /**
   * Tag cache entries for grouped invalidation
   */
  addTag(cacheKey, tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    
    for (const tag of tagArray) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(cacheKey);
    }
  }

  /**
   * Add custom invalidation rule
   */
  addRule(eventType, ruleFunction) {
    this.invalidationRules.set(eventType, ruleFunction);
  }

  /**
   * Main invalidation method based on events
   */
  async invalidate(eventType, data = {}) {
    try {
      const keysToInvalidate = new Set();
      
      // Get keys from rules
      if (this.invalidationRules.has(eventType)) {
        const ruleFunction = this.invalidationRules.get(eventType);
        const ruleKeys = ruleFunction(data);
        ruleKeys.forEach(key => keysToInvalidate.add(key));
        this.stats.ruleBasedInvalidations += ruleKeys.length;
      }
      
      // Handle pattern-based invalidation
      const invalidatedKeys = await this.invalidateKeys(Array.from(keysToInvalidate));
      
      // Handle cascade invalidation (dependencies)
      const cascadeKeys = await this.cascadeInvalidation(invalidatedKeys);
      
      this.stats.invalidations += invalidatedKeys.length;
      this.stats.cascadeInvalidations += cascadeKeys.length;
      
      return {
        eventType,
        invalidatedKeys,
        cascadeKeys,
        totalInvalidated: invalidatedKeys.length + cascadeKeys.length
      };
    } catch (error) {
      this.stats.errors++;
      console.error('CacheInvalidationManager: Invalidation error:', error);
      throw error;
    }
  }

  /**
   * Invalidate specific cache keys
   */
  async invalidateKeys(keys) {
    const invalidatedKeys = [];
    
    for (const key of keys) {
      // Handle wildcard patterns
      if (key.includes('*')) {
        await this.cache.invalidatePattern(key);
        invalidatedKeys.push(key);
      } else {
        await this.cache.delete(key);
        invalidatedKeys.push(key);
      }
    }
    
    return invalidatedKeys;
  }

  /**
   * Invalidate all cache entries with a specific tag
   */
  async invalidateTag(tag) {
    const keys = this.tags.get(tag);
    if (!keys || keys.size === 0) {
      return [];
    }
    
    const invalidatedKeys = await this.invalidateKeys(Array.from(keys));
    this.stats.tagInvalidations += invalidatedKeys.length;
    
    // Clean up tag mapping
    this.tags.delete(tag);
    
    return invalidatedKeys;
  }

  /**
   * Cascade invalidation to dependent keys
   */
  async cascadeInvalidation(invalidatedKeys) {
    const cascadeKeys = new Set();
    
    for (const key of invalidatedKeys) {
      const deps = this.dependencies.get(key);
      if (deps) {
        for (const depKey of deps) {
          cascadeKeys.add(depKey);
        }
      }
    }
    
    if (cascadeKeys.size > 0) {
      await this.invalidateKeys(Array.from(cascadeKeys));
    }
    
    return Array.from(cascadeKeys);
  }

  /**
   * Extract date from various formats
   */
  extractDate(date) {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    if (typeof date === 'string') {
      // Handle ISO string or date-only format
      return date.split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get invalidation statistics
   */
  getStats() {
    return {
      ...this.stats,
      registeredRules: this.invalidationRules.size,
      trackedDependencies: this.dependencies.size,
      activeTags: this.tags.size
    };
  }

  /**
   * Clear all invalidation metadata
   */
  clear() {
    this.dependencies.clear();
    this.tags.clear();
    // Keep rules as they're reusable
  }

  /**
   * Export invalidation configuration (for debugging/backup)
   */
  exportConfiguration() {
    return {
      rules: Array.from(this.invalidationRules.keys()),
      dependencies: Array.from(this.dependencies.entries()).map(([key, deps]) => ({
        key,
        dependencies: Array.from(deps)
      })),
      tags: Array.from(this.tags.entries()).map(([tag, keys]) => ({
        tag,
        keys: Array.from(keys)
      }))
    };
  }

  /**
   * Setup automatic invalidation based on database triggers
   */
  setupDatabaseTriggers(eventEmitter) {
    // Order events
    eventEmitter.on('order:created', (data) => this.invalidate('ORDER_CREATED', data));
    eventEmitter.on('order:updated', (data) => this.invalidate('ORDER_UPDATED', data));
    eventEmitter.on('order:delivered', (data) => this.invalidate('ORDER_DELIVERED', data));
    
    // Financial events
    eventEmitter.on('expense:created', (data) => this.invalidate('EXPENSE_CREATED', data));
    eventEmitter.on('cash-closing:created', (data) => this.invalidate('CASH_CLOSING_CREATED', data));
    
    // Product events
    eventEmitter.on('product:updated', (data) => this.invalidate('PRODUCT_UPDATED', data));
    eventEmitter.on('menu:updated', (data) => this.invalidate('MENU_UPDATED', data));
    
    // Customer events
    eventEmitter.on('customer:updated', (data) => this.invalidate('CUSTOMER_UPDATED', data));
  }

  /**
   * Advanced invalidation strategies
   */
  async smartInvalidate(context) {
    const { operation, entity, changes, timestamp } = context;
    
    // Time-based invalidation
    if (this.shouldInvalidateByTime(entity, timestamp)) {
      await this.invalidateTag(`${entity}:old`);
    }
    
    // Change-based invalidation
    if (this.shouldInvalidateByChanges(entity, changes)) {
      await this.invalidate(`${entity.toUpperCase()}_UPDATED`, changes);
    }
    
    // Predictive invalidation
    const predictedKeys = this.predictInvalidation(operation, entity, changes);
    if (predictedKeys.length > 0) {
      await this.invalidateKeys(predictedKeys);
    }
  }

  /**
   * Check if invalidation is needed based on time
   */
  shouldInvalidateByTime(entity, timestamp) {
    const now = Date.now();
    const age = now - timestamp;
    
    // Different entities have different staleness thresholds
    const thresholds = {
      order: 300000, // 5 minutes
      product: 3600000, // 1 hour
      customer: 900000, // 15 minutes
      financial: 600000 // 10 minutes
    };
    
    return age > (thresholds[entity] || 600000);
  }

  /**
   * Check if invalidation is needed based on changes
   */
  shouldInvalidateByChanges(entity, changes) {
    // Critical fields that always trigger invalidation
    const criticalFields = {
      order: ['status', 'total', 'payment_method'],
      product: ['price', 'available', 'category'],
      customer: ['points', 'phone', 'address'],
      financial: ['amount', 'type', 'category']
    };
    
    const entityFields = criticalFields[entity] || [];
    return Object.keys(changes).some(field => entityFields.includes(field));
  }

  /**
   * Predict which cache keys might need invalidation
   */
  predictInvalidation(operation, entity, changes) {
    const predictions = [];
    
    // Predictive patterns based on common access patterns
    if (operation === 'update' && entity === 'order') {
      if (changes.status === 'delivered') {
        predictions.push('dashboard:delivery-performance:today');
        predictions.push('analytics:peak-hours:today');
      }
    }
    
    if (operation === 'create' && entity === 'expense') {
      const month = new Date().toISOString().slice(0, 7);
      predictions.push(`reports:monthly-summary:${month}`);
    }
    
    return predictions;
  }
}

module.exports = CacheInvalidationManager;