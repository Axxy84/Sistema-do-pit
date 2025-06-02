# Exemplos Práticos - Sistema de Cache

## Como Usar o Cache em Novas Rotas

### Exemplo 1: Rota Simples com Cache
```javascript
const cache = require('../cache/cache-manager');
const { CacheKeys } = require('../cache/cache-keys');

// GET /api/produtos-populares
router.get('/produtos-populares', async (req, res) => {
  try {
    const cacheKey = 'produtos:populares';
    
    // Cache-Aside: verifica cache primeiro
    const produtos = await cache.getOrFetch(cacheKey, async () => {
      // Só executa se não estiver no cache
      const result = await db.query(`
        SELECT nome, COUNT(*) as vendas
        FROM produtos p
        JOIN itens_pedido ip ON p.id = ip.produto_id_ref
        GROUP BY nome
        ORDER BY vendas DESC
        LIMIT 10
      `);
      return result.rows;
    }, 600); // Cache por 10 minutos
    
    res.json({ produtos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Exemplo 2: Cache com Parâmetros Dinâmicos
```javascript
// GET /api/vendas-por-periodo/:dias
router.get('/vendas-por-periodo/:dias', async (req, res) => {
  try {
    const { dias } = req.params;
    const cacheKey = `vendas:periodo:${dias}`;
    
    const vendas = await cache.getOrFetch(cacheKey, async () => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(dias));
      
      const result = await db.query(`
        SELECT DATE(data_pedido) as data, SUM(total) as total
        FROM pedidos
        WHERE data_pedido >= $1 AND status_pedido = 'entregue'
        GROUP BY DATE(data_pedido)
        ORDER BY data
      `, [dataInicio]);
      
      return result.rows;
    }, 900); // Cache por 15 minutos
    
    res.json({ vendas, periodo: `${dias} dias` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Exemplo 3: Invalidação Automática ao Modificar Dados
```javascript
// POST /api/produtos
router.post('/', async (req, res) => {
  try {
    const { nome, preco, categoria } = req.body;
    
    // Criar produto
    const result = await db.query(`
      INSERT INTO produtos (nome, preco, categoria)
      VALUES ($1, $2, $3) RETURNING *
    `, [nome, preco, categoria]);
    
    // Invalidar caches relacionados a produtos
    cache.deletePattern('produtos:.*'); // Todos os caches de produtos
    cache.deletePattern('dashboard:top_pizzas:.*'); // Top pizzas podem ter mudado
    
    res.status(201).json({ produto: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Testando o Cache

### 1. Teste Básico no Terminal
```bash
# Primeira requisição (cache miss)
curl http://localhost:3000/api/dashboard
# Logs: ❌ Cache MISS: dashboard:data

# Segunda requisição (cache hit)
curl http://localhost:3000/api/dashboard  
# Logs: 🎯 Cache HIT: dashboard:data
```

### 2. Monitoramento via API
```bash
# Ver estatísticas
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/cache-admin/stats

# Resultado:
# {
#   "totalItems": 5,
#   "keys": ["dashboard:data", "orders:list", "reports:sales:2024-01-01:2024-01-31"],
#   "message": "Cache contém 5 itens"
# }
```

### 3. Limpeza Seletiva
```bash
# Limpar apenas dados de dashboard
curl -X DELETE -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/cache-admin/pattern/dashboard

# Limpar tudo
curl -X DELETE -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/cache-admin/clear
```

## Padrões de Uso Recomendados

### 1. TTL por Tipo de Consulta
```javascript
// Dados em tempo real (pedidos ativos)
const pedidosAtivos = await cache.getOrFetch(key, fetcher, 60); // 1 minuto

// Dados do dia (vendas hoje)
const vendasHoje = await cache.getOrFetch(key, fetcher, 300); // 5 minutos

// Dados históricos (relatórios)
const relatorio = await cache.getOrFetch(key, fetcher, 900); // 15 minutos

// Dados imutáveis (pedidos entregues)
const pedidoFinalizado = await cache.getOrFetch(key, fetcher, 1800); // 30 minutos
```

### 2. Chaves de Cache Organizadas
```javascript
// ✅ BOM: Chaves estruturadas
const chaves = {
  vendas: `vendas:${periodo}:${tipo}`,
  cliente: `cliente:${id}:pedidos`,
  relatorio: `relatorio:${tipo}:${inicio}:${fim}`
};

// ❌ EVITAR: Chaves genéricas
const chaves = {
  dados: 'dados',
  info: 'cliente_info',
  vendas: 'vendas_mes'
};
```

### 3. Invalidação Inteligente
```javascript
// ✅ BOM: Invalidação específica
function invalidarVendas(novoEstado) {
  if (novoEstado === 'entregue') {
    cache.deletePattern('vendas:.*');
    cache.deletePattern('dashboard:.*');
  }
}

// ✅ BOM: Invalidação granular
function invalidarCliente(clienteId) {
  cache.delete(`cliente:${clienteId}:dados`);
  cache.delete(`cliente:${clienteId}:pedidos`);
  // Não precisa invalidar outros clientes
}
```

## Debug e Troubleshooting

### 1. Logs de Debug
```javascript
// Ativar logs detalhados (já ativo por padrão)
console.log(`🎯 Cache HIT: ${key}`);   // Cache encontrado
console.log(`❌ Cache MISS: ${key}`);  // Cache não encontrado
console.log(`💾 Cache SET: ${key}`);   // Item armazenado
console.log(`🗑️ Cache DELETE: ${key}`); // Item removido
```

### 2. Verificação de Performance
```javascript
// Medir tempo de consulta
const inicio = Date.now();
const dados = await cache.getOrFetch(key, fetcher, ttl);
const tempo = Date.now() - inicio;
console.log(`⏱️ Consulta executada em ${tempo}ms`);
```

### 3. Health Check Personalizado
```javascript
// GET /api/health-cache (exemplo)
router.get('/health-cache', async (req, res) => {
  const stats = cache.getStats();
  const testKey = 'test_' + Date.now();
  
  // Teste write/read
  cache.set(testKey, { test: true }, 10);
  const retrieved = cache.get(testKey);
  cache.delete(testKey);
  
  res.json({
    status: retrieved ? 'OK' : 'FAIL',
    totalItems: stats.totalItems,
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

## Integração com Frontend

### 1. Indicador de Cache no Frontend
```javascript
// Adicionar header customizado (opcional)
router.get('/api/dashboard', async (req, res) => {
  const cached = cache.get(cacheKey);
  const data = cached || await fetchData();
  
  res.set('X-Cache-Status', cached ? 'HIT' : 'MISS');
  res.json(data);
});
```

### 2. Força Refresh do Cache
```javascript
// GET /api/dashboard?refresh=true
router.get('/dashboard', async (req, res) => {
  const { refresh } = req.query;
  const cacheKey = 'dashboard:data';
  
  if (refresh === 'true') {
    cache.delete(cacheKey); // Força nova consulta
  }
  
  const data = await cache.getOrFetch(cacheKey, fetchData, 300);
  res.json(data);
});
```

### 3. Cache com Fallback
```javascript
router.get('/api/dados-criticos', async (req, res) => {
  try {
    const dados = await cache.getOrFetch(key, async () => {
      const result = await db.query('SELECT * FROM dados_criticos');
      return result.rows;
    }, 300);
    
    res.json({ dados, source: 'cache' });
  } catch (error) {
    // Fallback: tentar cache expirado
    const dadosExpirados = cache.cache.get(key);
    if (dadosExpirados) {
      res.json({ 
        dados: dadosExpirados, 
        source: 'cache_expired',
        warning: 'Dados podem estar desatualizados'
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});
```

## Métricas e Monitoramento

### 1. Calcular Hit Rate
```javascript
let cacheHits = 0;
let cacheMisses = 0;

// Sobrescrever métodos de cache para contar
const originalGet = cache.get;
cache.get = function(key) {
  const result = originalGet.call(this, key);
  if (result !== null) {
    cacheHits++;
  } else {
    cacheMisses++;
  }
  return result;
};

// GET /api/cache-metrics
router.get('/cache-metrics', (req, res) => {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total * 100).toFixed(2) : 0;
  
  res.json({
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: `${hitRate}%`,
    totalRequests: total
  });
});
```

### 2. Alertas de Performance
```javascript
// Alertar se hit rate muito baixo
setInterval(() => {
  const total = cacheHits + cacheMisses;
  if (total > 100) {
    const hitRate = cacheHits / total;
    if (hitRate < 0.5) { // menos de 50%
      console.warn(`⚠️ Cache hit rate baixo: ${(hitRate * 100).toFixed(2)}%`);
    }
  }
}, 60000); // Verificar a cada minuto
``` 