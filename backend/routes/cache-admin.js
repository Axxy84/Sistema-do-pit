/**
 * Rotas administrativas para gerenciamento do cache
 * Útil para monitoramento, debug e controle manual do cache
 */

const express = require('express');
const router = express.Router();
const cache = require('../cache/cache-manager');
const { authenticateToken } = require('../middleware/auth');

// GET /api/cache-admin/stats - Estatísticas completas do cache com métricas
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = cache.getStats();
    
    res.json({
      cache: {
        totalItems: stats.totalItems,
        keys: stats.keys,
        message: `Cache contém ${stats.totalItems} itens`
      },
      metrics: stats.metrics
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
      hitRate: stats.metrics?.summary?.hitRate || '0%',
      performance: stats.metrics?.performance?.performanceImprovement || '0%',
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

// GET /api/cache-admin/metrics - Métricas detalhadas de performance
router.get('/metrics', authenticateToken, (req, res) => {
  try {
    const stats = cache.getStats();
    
    res.json({
      timestamp: new Date().toISOString(),
      metrics: stats.metrics,
      recommendations: generateCacheRecommendations(stats.metrics)
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/cache-admin/report - Relatório de performance
router.get('/report', authenticateToken, (req, res) => {
  try {
    const report = cache.generatePerformanceReport();
    
    res.json({
      timestamp: new Date().toISOString(),
      report: report,
      status: 'generated'
    });
  } catch (error) {
    console.error('Erro ao gerar relatório do cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/cache-admin/metrics/reset - Reset métricas
router.post('/metrics/reset', authenticateToken, (req, res) => {
  try {
    cache.resetMetrics();
    
    res.json({
      message: 'Métricas de cache resetadas com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao resetar métricas do cache:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

/**
 * Gera recomendações baseadas nas métricas de cache
 */
function generateCacheRecommendations(metrics) {
  const recommendations = [];
  
  if (!metrics || !metrics.summary) {
    return ['Métricas insuficientes para gerar recomendações'];
  }
  
  const hitRate = parseFloat(metrics.summary.hitRate);
  const totalRequests = metrics.summary.totalRequests;
  
  // Análise da taxa de acerto
  if (hitRate < 60) {
    recommendations.push({
      type: 'warning',
      category: 'hit_rate',
      message: `Taxa de acerto baixa (${hitRate}%). Considere aumentar TTL para dados estáveis.`,
      priority: 'high'
    });
  } else if (hitRate > 85) {
    recommendations.push({
      type: 'success',
      category: 'hit_rate',
      message: `Excelente taxa de acerto (${hitRate}%). Cache bem otimizado.`,
      priority: 'info'
    });
  }
  
  // Análise por categoria
  if (metrics.categoryBreakdown) {
    metrics.categoryBreakdown.forEach(category => {
      const catHitRate = parseFloat(category.hitRate);
      
      if (catHitRate < 50 && (category.hits + category.misses) > 10) {
        recommendations.push({
          type: 'warning',
          category: 'category_performance',
          message: `Categoria '${category.category}' com baixa taxa de acerto (${category.hitRate}). Revisar estratégia de cache.`,
          priority: 'medium'
        });
      }
    });
  }
  
  // Análise de volume
  if (totalRequests < 100) {
    recommendations.push({
      type: 'info',
      category: 'volume',
      message: 'Volume baixo de requisições. Métricas podem não ser representativas.',
      priority: 'low'
    });
  }
  
  // Análise de performance
  if (metrics.performance && metrics.performance.performanceImprovement) {
    const improvement = parseFloat(metrics.performance.performanceImprovement);
    
    if (improvement > 70) {
      recommendations.push({
        type: 'success',
        category: 'performance',
        message: `Excelente melhoria de performance (${improvement}%). Cache muito efetivo.`,
        priority: 'info'
      });
    } else if (improvement < 30) {
      recommendations.push({
        type: 'warning',
        category: 'performance',
        message: `Melhoria modesta de performance (${improvement}%). Verificar se queries estão sendo otimizadas.`,
        priority: 'medium'
      });
    }
  }
  
  return recommendations.length > 0 ? recommendations : [
    {
      type: 'info',
      category: 'general',
      message: 'Sistema de cache funcionando dentro dos parâmetros normais.',
      priority: 'info'
    }
  ];
}

module.exports = router; 