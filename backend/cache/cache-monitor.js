/**
 * Comprehensive cache monitoring and health reporting
 * Provides real-time metrics, alerts, and performance insights
 */
class CacheMonitor {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.startTime = Date.now();
    
    // Configuration
    this.config = {
      metricsInterval: options.metricsInterval || 300000, // 5 minutes
      alertThresholds: {
        hitRate: 70, // Alert if hit rate drops below 70%
        errorRate: 5, // Alert if error rate exceeds 5%
        memoryUsage: 90, // Alert if memory usage exceeds 90%
        responseTime: 500, // Alert if avg response time > 500ms
        ...options.alertThresholds
      },
      enableAutoLogging: options.enableAutoLogging !== false,
      logLevel: options.logLevel || 'info',
      ...options
    };
    
    // Metrics storage
    this.metrics = {
      requests: [],
      errors: [],
      performance: [],
      alerts: [],
      hourlyStats: new Map()
    };
    
    // Performance tracking
    this.performanceBuffer = [];
    this.maxBufferSize = 1000;
    
    // Start monitoring if enabled
    if (this.config.enableAutoLogging) {
      this.startPeriodicLogging();
    }
  }

  /**
   * Record a cache operation
   */
  recordOperation(operation, key, hit, duration, error = null) {
    const timestamp = Date.now();
    const hour = new Date(timestamp).toISOString().slice(0, 13);
    
    // Record to buffer
    this.performanceBuffer.push({
      timestamp,
      operation,
      key,
      hit,
      duration,
      error: error ? error.message : null
    });
    
    // Trim buffer if needed
    if (this.performanceBuffer.length > this.maxBufferSize) {
      this.performanceBuffer.shift();
    }
    
    // Update hourly stats
    if (!this.metrics.hourlyStats.has(hour)) {
      this.metrics.hourlyStats.set(hour, {
        operations: 0,
        hits: 0,
        misses: 0,
        errors: 0,
        totalDuration: 0
      });
    }
    
    const hourStats = this.metrics.hourlyStats.get(hour);
    hourStats.operations++;
    if (hit) hourStats.hits++;
    else hourStats.misses++;
    if (error) hourStats.errors++;
    hourStats.totalDuration += duration;
    
    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Get comprehensive health report
   */
  async getHealthReport() {
    const cacheStats = this.cache.getStats();
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    // Calculate performance metrics
    const recentOps = this.performanceBuffer.slice(-100);
    const avgResponseTime = recentOps.length > 0
      ? recentOps.reduce((sum, op) => sum + op.duration, 0) / recentOps.length
      : 0;
    
    // Calculate error rate
    const recentErrors = recentOps.filter(op => op.error).length;
    const errorRate = recentOps.length > 0
      ? (recentErrors / recentOps.length * 100)
      : 0;
    
    const report = {
      status: this.determineHealthStatus(cacheStats, errorRate, avgResponseTime),
      uptime: {
        seconds: Math.floor(uptime / 1000),
        formatted: this.formatUptime(uptime)
      },
      cache: cacheStats,
      performance: {
        avgResponseTimeMs: avgResponseTime.toFixed(2),
        errorRate: `${errorRate.toFixed(2)}%`,
        operationsPerSecond: this.calculateOpsPerSecond(),
        recentOperations: recentOps.length
      },
      memory: {
        heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        externalMB: (memoryUsage.external / 1024 / 1024).toFixed(2),
        rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2)
      },
      alerts: this.metrics.alerts.slice(-10), // Last 10 alerts
      timestamp: new Date().toISOString()
    };
    
    // Add distributed cache health if applicable
    if (this.cache.healthCheck) {
      report.distributedHealth = await this.cache.healthCheck();
    }
    
    return report;
  }

  /**
   * Get detailed metrics report
   */
  getMetricsReport() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;
    
    // Calculate time-based metrics
    const lastHourOps = this.performanceBuffer.filter(op => op.timestamp > hourAgo);
    const lastDayOps = this.performanceBuffer.filter(op => op.timestamp > dayAgo);
    
    // Category breakdown
    const categoryStats = this.calculateCategoryStats(lastHourOps);
    
    // Time distribution
    const timeDistribution = this.calculateTimeDistribution(lastDayOps);
    
    // Top keys by access frequency
    const topKeys = this.calculateTopKeys(lastHourOps, 10);
    
    // Performance percentiles
    const percentiles = this.calculatePercentiles(
      lastHourOps.map(op => op.duration)
    );
    
    return {
      summary: {
        totalOperations: this.performanceBuffer.length,
        lastHourOperations: lastHourOps.length,
        lastDayOperations: lastDayOps.length
      },
      performance: {
        percentiles,
        avgResponseTimeMs: this.calculateAverage(lastHourOps.map(op => op.duration)),
        maxResponseTimeMs: Math.max(...lastHourOps.map(op => op.duration)),
        minResponseTimeMs: Math.min(...lastHourOps.map(op => op.duration))
      },
      categories: categoryStats,
      timeDistribution,
      topKeys,
      hourlyTrends: this.getHourlyTrends(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Setup metrics endpoint
   */
  setupMetricsEndpoint(app) {
    // Health endpoint
    app.get('/metrics/cache/health', async (req, res) => {
      try {
        const report = await this.getHealthReport();
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Detailed metrics endpoint
    app.get('/metrics/cache/detailed', (req, res) => {
      try {
        const report = this.getMetricsReport();
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Prometheus-style metrics
    app.get('/metrics/cache/prometheus', (req, res) => {
      try {
        const metrics = this.getPrometheusMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Start periodic logging
   */
  startPeriodicLogging() {
    this.loggingInterval = setInterval(async () => {
      const report = await this.getHealthReport();
      
      if (this.config.logLevel === 'debug' || report.status !== 'healthy') {
        console.log('Cache Monitor Report:', JSON.stringify(report, null, 2));
      } else if (this.config.logLevel === 'info') {
        console.log(`Cache Monitor: Status=${report.status}, HitRate=${report.cache.hitRate || 'N/A'}, AvgResponse=${report.performance.avgResponseTimeMs}ms`);
      }
    }, this.config.metricsInterval);
  }

  /**
   * Stop periodic logging
   */
  stopPeriodicLogging() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
      this.loggingInterval = null;
    }
  }

  /**
   * Check for alert conditions
   */
  checkAlerts() {
    const cacheStats = this.cache.getStats();
    const recentOps = this.performanceBuffer.slice(-100);
    
    // Check hit rate
    const hitRate = parseFloat(cacheStats.hitRate || '0');
    if (hitRate < this.config.alertThresholds.hitRate) {
      this.addAlert('LOW_HIT_RATE', `Cache hit rate (${hitRate}%) below threshold`, 'warning');
    }
    
    // Check error rate
    const errorCount = recentOps.filter(op => op.error).length;
    const errorRate = recentOps.length > 0 ? (errorCount / recentOps.length * 100) : 0;
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.addAlert('HIGH_ERROR_RATE', `Error rate (${errorRate.toFixed(2)}%) above threshold`, 'error');
    }
    
    // Check memory usage
    if (cacheStats.memoryUtilization) {
      const memUsage = parseFloat(cacheStats.memoryUtilization);
      if (memUsage > this.config.alertThresholds.memoryUsage) {
        this.addAlert('HIGH_MEMORY_USAGE', `Memory usage (${memUsage}%) above threshold`, 'warning');
      }
    }
    
    // Check response time
    const avgResponseTime = recentOps.length > 0
      ? recentOps.reduce((sum, op) => sum + op.duration, 0) / recentOps.length
      : 0;
    if (avgResponseTime > this.config.alertThresholds.responseTime) {
      this.addAlert('SLOW_RESPONSE', `Average response time (${avgResponseTime.toFixed(2)}ms) above threshold`, 'warning');
    }
  }

  /**
   * Add an alert
   */
  addAlert(type, message, severity) {
    const alert = {
      type,
      message,
      severity,
      timestamp: new Date().toISOString()
    };
    
    this.metrics.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
    
    // Log critical alerts
    if (severity === 'error') {
      console.error(`Cache Alert [${type}]: ${message}`);
    }
  }

  /**
   * Calculate operations per second
   */
  calculateOpsPerSecond() {
    const recentOps = this.performanceBuffer.filter(
      op => op.timestamp > Date.now() - 60000 // Last minute
    );
    return (recentOps.length / 60).toFixed(2);
  }

  /**
   * Calculate category statistics
   */
  calculateCategoryStats(operations) {
    const categories = {};
    
    for (const op of operations) {
      const category = this.extractCategory(op.key);
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          hits: 0,
          totalDuration: 0
        };
      }
      
      categories[category].count++;
      if (op.hit) categories[category].hits++;
      categories[category].totalDuration += op.duration;
    }
    
    // Calculate rates and averages
    for (const [category, stats] of Object.entries(categories)) {
      stats.hitRate = stats.count > 0 ? (stats.hits / stats.count * 100).toFixed(2) : '0';
      stats.avgDuration = stats.count > 0 ? (stats.totalDuration / stats.count).toFixed(2) : '0';
    }
    
    return categories;
  }

  /**
   * Extract category from cache key
   */
  extractCategory(key) {
    if (!key) return 'unknown';
    const parts = key.split(':');
    return parts[0] || 'unknown';
  }

  /**
   * Calculate time distribution
   */
  calculateTimeDistribution(operations) {
    const distribution = {};
    
    for (const op of operations) {
      const hour = new Date(op.timestamp).getHours();
      if (!distribution[hour]) {
        distribution[hour] = 0;
      }
      distribution[hour]++;
    }
    
    return distribution;
  }

  /**
   * Calculate top accessed keys
   */
  calculateTopKeys(operations, limit = 10) {
    const keyCount = {};
    
    for (const op of operations) {
      if (!keyCount[op.key]) {
        keyCount[op.key] = 0;
      }
      keyCount[op.key]++;
    }
    
    return Object.entries(keyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }

  /**
   * Calculate percentiles
   */
  calculatePercentiles(values) {
    if (values.length === 0) return {};
    
    const sorted = values.sort((a, b) => a - b);
    const percentile = (p) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };
    
    return {
      p50: percentile(50).toFixed(2),
      p75: percentile(75).toFixed(2),
      p90: percentile(90).toFixed(2),
      p95: percentile(95).toFixed(2),
      p99: percentile(99).toFixed(2)
    };
  }

  /**
   * Calculate average
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2);
  }

  /**
   * Get hourly trends
   */
  getHourlyTrends() {
    const trends = [];
    const hours = Array.from(this.metrics.hourlyStats.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-24); // Last 24 hours
    
    for (const [hour, stats] of hours) {
      trends.push({
        hour,
        operations: stats.operations,
        hitRate: stats.operations > 0 ? (stats.hits / stats.operations * 100).toFixed(2) : '0',
        avgDuration: stats.operations > 0 ? (stats.totalDuration / stats.operations).toFixed(2) : '0',
        errorRate: stats.operations > 0 ? (stats.errors / stats.operations * 100).toFixed(2) : '0'
      });
    }
    
    return trends;
  }

  /**
   * Determine overall health status
   */
  determineHealthStatus(cacheStats, errorRate, avgResponseTime) {
    const hitRate = parseFloat(cacheStats.hitRate || '0');
    
    if (errorRate > this.config.alertThresholds.errorRate * 2) {
      return 'critical';
    }
    
    if (hitRate < this.config.alertThresholds.hitRate - 20) {
      return 'degraded';
    }
    
    if (avgResponseTime > this.config.alertThresholds.responseTime * 2) {
      return 'degraded';
    }
    
    if (
      hitRate < this.config.alertThresholds.hitRate ||
      errorRate > this.config.alertThresholds.errorRate ||
      avgResponseTime > this.config.alertThresholds.responseTime
    ) {
      return 'warning';
    }
    
    return 'healthy';
  }

  /**
   * Format uptime
   */
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get Prometheus-style metrics
   */
  getPrometheusMetrics() {
    const cacheStats = this.cache.getStats();
    const metrics = [];
    
    // Cache hit rate
    metrics.push(`# HELP cache_hit_rate The cache hit rate percentage`);
    metrics.push(`# TYPE cache_hit_rate gauge`);
    metrics.push(`cache_hit_rate ${parseFloat(cacheStats.hitRate || '0')}`);
    
    // Cache size
    metrics.push(`# HELP cache_size_total Total number of entries in cache`);
    metrics.push(`# TYPE cache_size_total gauge`);
    metrics.push(`cache_size_total ${cacheStats.size || 0}`);
    
    // Memory usage
    if (cacheStats.memoryUsageMB) {
      metrics.push(`# HELP cache_memory_usage_bytes Cache memory usage in bytes`);
      metrics.push(`# TYPE cache_memory_usage_bytes gauge`);
      metrics.push(`cache_memory_usage_bytes ${parseFloat(cacheStats.memoryUsageMB) * 1024 * 1024}`);
    }
    
    // Operations per second
    metrics.push(`# HELP cache_operations_per_second Operations per second`);
    metrics.push(`# TYPE cache_operations_per_second gauge`);
    metrics.push(`cache_operations_per_second ${this.calculateOpsPerSecond()}`);
    
    return metrics.join('\n');
  }
}

module.exports = CacheMonitor;