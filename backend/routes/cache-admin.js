/**
 * Rotas administrativas para gerenciamento do cache
 * Útil para monitoramento, debug e controle manual do cache
 */

const express = require('express');
const router = express.Router();
const cache = require('../cache/cache-manager');
const { authenticateToken } = require('../middleware/auth');

// GET /api/cache-admin/stats - Estatísticas do cache
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = cache.getStats();
    
    res.json({
      totalItems: stats.totalItems,
      keys: stats.keys,
      message: `Cache contém ${stats.totalItems} itens`
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/cache-admin/clear - Limpar todo o cache
router.delete('/clear', authenticateToken, (req, res) => {
  try {
    const statsBefore = cache.getStats();
    cache.clear();
    
    res.json({
      message: 'Cache limpo com sucesso',
      itemsRemoved: statsBefore.totalItems
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/cache-admin/pattern/:pattern - Limpar cache por padrão
router.delete('/pattern/:pattern', authenticateToken, (req, res) => {
  try {
    const { pattern } = req.params;
    const statsBefore = cache.getStats();
    
    cache.deletePattern(pattern);
    
    const statsAfter = cache.getStats();
    const itemsRemoved = statsBefore.totalItems - statsAfter.totalItems;
    
    res.json({
      message: `Cache limpo por padrão: ${pattern}`,
      pattern: pattern,
      itemsRemoved: itemsRemoved
    });
  } catch (error) {
    console.error('Erro ao limpar cache por padrão:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/cache-admin/key/:key - Remover chave específica
router.delete('/key/:key', authenticateToken, (req, res) => {
  try {
    const { key } = req.params;
    
    cache.delete(key);
    
    res.json({
      message: `Chave removida: ${key}`,
      key: key
    });
  } catch (error) {
    console.error('Erro ao remover chave do cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/cache-admin/cleanup - Forçar limpeza de itens expirados
router.post('/cleanup', authenticateToken, (req, res) => {
  try {
    const statsBefore = cache.getStats();
    cache.cleanup();
    const statsAfter = cache.getStats();
    
    const itemsRemoved = statsBefore.totalItems - statsAfter.totalItems;
    
    res.json({
      message: 'Limpeza de cache executada',
      itemsRemoved: itemsRemoved,
      remainingItems: statsAfter.totalItems
    });
  } catch (error) {
    console.error('Erro ao executar limpeza do cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/cache-admin/key/:key - Buscar valor específico no cache
router.get('/key/:key', authenticateToken, (req, res) => {
  try {
    const { key } = req.params;
    const value = cache.get(key);
    
    if (value === null) {
      return res.status(404).json({
        message: 'Chave não encontrada no cache',
        key: key
      });
    }
    
    res.json({
      key: key,
      value: value,
      found: true
    });
  } catch (error) {
    console.error('Erro ao buscar chave no cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/cache-admin/health - Health check do sistema de cache
router.get('/health', authenticateToken, (req, res) => {
  try {
    const stats = cache.getStats();
    const testKey = 'health_check_' + Date.now();
    const testValue = { timestamp: new Date().toISOString() };
    
    // Teste de escrita
    cache.set(testKey, testValue, 10); // 10 segundos TTL
    
    // Teste de leitura
    const retrievedValue = cache.get(testKey);
    
    // Limpeza
    cache.delete(testKey);
    
    const isHealthy = retrievedValue !== null && 
                     retrievedValue.timestamp === testValue.timestamp;
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      totalItems: stats.totalItems,
      testPassed: isHealthy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no health check do cache:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 