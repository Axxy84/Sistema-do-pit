/**
 * Migration script to transition from old cache to new enhanced cache
 * Run this to safely update the cache system without breaking existing code
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting cache migration...\n');

// Step 1: Backup the old cache manager
const oldCachePath = path.join(__dirname, 'cache-manager.js');
const backupPath = path.join(__dirname, 'cache-manager.backup.js');

try {
  // Check if backup already exists
  if (fs.existsSync(backupPath)) {
    console.log('⚠️  Backup already exists. Migration may have already been run.');
    console.log('   To re-run migration, delete cache-manager.backup.js first.\n');
  } else {
    // Create backup
    fs.copyFileSync(oldCachePath, backupPath);
    console.log('✅ Created backup: cache-manager.backup.js');
  }
} catch (error) {
  console.error('❌ Failed to create backup:', error.message);
  process.exit(1);
}

// Step 2: Create the new cache manager content that uses V2
const newCacheManagerContent = `/**
 * Cache Manager - Enhanced version with backward compatibility
 * This file maintains the same API as the original cache-manager.js
 * but uses the new robust cache system internally
 */

// Use the enhanced cache manager v2
const enhancedCache = require('./cache-manager-v2');

// Export the enhanced cache with the same interface
module.exports = enhancedCache;

// Legacy compatibility exports
module.exports.CacheManager = enhancedCache.EnhancedCacheManager;
`;

// Step 3: Update the cache manager file
try {
  fs.writeFileSync(oldCachePath, newCacheManagerContent);
  console.log('✅ Updated cache-manager.js to use enhanced version');
} catch (error) {
  console.error('❌ Failed to update cache-manager.js:', error.message);
  
  // Restore backup
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, oldCachePath);
    console.log('⚠️  Restored original cache-manager.js from backup');
  }
  
  process.exit(1);
}

// Step 4: Update package.json to include Redis as optional dependency
const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add Redis to optionalDependencies if not present
  if (!packageJson.optionalDependencies) {
    packageJson.optionalDependencies = {};
  }
  
  if (!packageJson.optionalDependencies.redis) {
    packageJson.optionalDependencies.redis = "^4.6.13";
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added Redis to optional dependencies');
    console.log('   Run "npm install" to install Redis support (optional)');
  } else {
    console.log('ℹ️  Redis already in optional dependencies');
  }
} catch (error) {
  console.log('⚠️  Could not update package.json:', error.message);
  console.log('   You may want to manually add Redis to optionalDependencies');
}

// Step 5: Create example environment configuration
const envExampleContent = `# Cache Configuration Examples
# Add these to your .env file

# Cache Strategy: local, redis, or hybrid (default: hybrid)
CACHE_STRATEGY=hybrid

# Local Cache Configuration
L1_CACHE_SIZE=1000              # Max items in local cache
L1_CACHE_MEMORY_MB=100          # Max memory for local cache in MB
DEFAULT_TTL_SECONDS=600         # Default TTL in seconds

# Redis Configuration (optional for hybrid/redis strategies)
REDIS_URL=redis://localhost:6379
# Or use individual settings:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your_password
# REDIS_DB=0

# Cache Monitoring
ENABLE_CACHE_METRICS=true
METRICS_INTERVAL=300000         # Metrics logging interval in ms

# Alert Thresholds
ALERT_HIT_RATE=70              # Alert if hit rate drops below 70%
ALERT_ERROR_RATE=5             # Alert if error rate exceeds 5%
ALERT_MEMORY_USAGE=90          # Alert if memory usage exceeds 90%
ALERT_RESPONSE_TIME=500        # Alert if avg response time > 500ms

# TTL Configuration by Data Type (in seconds)
TTL_DASHBOARD=300              # 5 minutes
TTL_FINANCIAL=600              # 10 minutes
TTL_ORDERS=900                 # 15 minutes
TTL_PRODUCTS=3600              # 1 hour
TTL_CUSTOMERS=900              # 15 minutes
TTL_REPORTS=1800               # 30 minutes
TTL_MENU=3600                  # 1 hour
TTL_ANALYTICS=600              # 10 minutes
`;

const envExamplePath = path.join(__dirname, 'cache.env.example');
try {
  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✅ Created cache.env.example with configuration examples');
} catch (error) {
  console.log('⚠️  Could not create env example file:', error.message);
}

// Step 6: Test the migration
console.log('\n📋 Testing migration...');

try {
  const cache = require('./cache-manager');
  
  // Test basic operations
  Promise.resolve().then(async () => {
    // Set a test value
    await cache.set('migration-test', { success: true }, 60);
    
    // Get the test value
    const value = await cache.get('migration-test');
    
    if (value && value.success === true) {
      console.log('✅ Cache operations working correctly');
    } else {
      console.log('❌ Cache operations test failed');
    }
    
    // Clean up
    await cache.delete('migration-test');
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review cache.env.example and update your .env file');
    console.log('2. Run "npm install" to install optional Redis support');
    console.log('3. Monitor cache performance at /api/cache/stats');
    console.log('4. The old cache manager is backed up as cache-manager.backup.js');
  }).catch(error => {
    console.error('❌ Migration test failed:', error);
    
    // Restore backup
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, oldCachePath);
      console.log('⚠️  Restored original cache-manager.js from backup');
    }
  });
} catch (error) {
  console.error('❌ Failed to test migration:', error.message);
  
  // Restore backup
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, oldCachePath);
    console.log('⚠️  Restored original cache-manager.js from backup');
  }
}