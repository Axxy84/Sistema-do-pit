/**
 * Cache Manager - Implementação do padrão Cache-Aside com TTL
 * Sistema de cache em memória local para otimizar consultas pesadas do ERP
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    
    // Limpeza automática a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Busca um item no cache
   * @param {string} key - Chave do cache
   * @returns {*|null} - Dados do cache ou null se não encontrado/expirado
   */
  get(key) {
    const now = Date.now();
    const expiry = this.ttlMap.get(key);
    
    // Verifica se o item existe e não expirou
    if (this.cache.has(key) && expiry && now < expiry) {
      console.log(`🎯 Cache HIT: ${key}`);
      return this.cache.get(key);
    }
    
    // Remove item expirado
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.ttlMap.delete(key);
      console.log(`⏰ Cache EXPIRED: ${key}`);
    }
    
    console.log(`❌ Cache MISS: ${key}`);
    return null;
  }

  /**
   * Armazena um item no cache com TTL
   * @param {string} key - Chave do cache
   * @param {*} value - Valor a ser armazenado
   * @param {number} ttlSeconds - Tempo de vida em segundos (padrão: 300 = 5 minutos)
   */
  set(key, value, ttlSeconds = 300) {
    const expiry = Date.now() + (ttlSeconds * 1000);
    
    this.cache.set(key, value);
    this.ttlMap.set(key, expiry);
    
    console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Remove um item específico do cache
   * @param {string} key - Chave do cache
   */
  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
    console.log(`🗑️ Cache DELETE: ${key}`);
  }

  /**
   * Remove múltiplos itens do cache baseado em padrão
   * @param {string} pattern - Padrão para buscar chaves (regex)
   */
  deletePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`🗑️ Cache DELETE PATTERN: ${pattern} (${keysToDelete.length} items)`);
  }

  /**
   * Limpa itens expirados do cache
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expiry] of this.ttlMap.entries()) {
      if (now >= expiry) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.ttlMap.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cache CLEANUP: ${expiredKeys.length} items expired`);
    }
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
    console.log('🧹 Cache CLEAR: All items removed');
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    return {
      totalItems: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Função helper para Cache-Aside pattern
   * Verifica cache primeiro, se não encontrar executa a função e armazena o resultado
   * @param {string} key - Chave do cache
   * @param {Function} dataFetcher - Função que busca os dados
   * @param {number} ttlSeconds - TTL em segundos
   * @returns {Promise<*>} - Dados do cache ou da função
   */
  async getOrFetch(key, dataFetcher, ttlSeconds = 300) {
    // Tenta buscar no cache primeiro
    const cachedData = this.get(key);
    if (cachedData !== null) {
      return cachedData;
    }
    
    // Cache miss - busca os dados
    try {
      const data = await dataFetcher();
      this.set(key, data, ttlSeconds);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching data for cache key ${key}:`, error);
      throw error;
    }
  }
}

// Instância única do cache
const cache = new CacheManager();

module.exports = cache; 