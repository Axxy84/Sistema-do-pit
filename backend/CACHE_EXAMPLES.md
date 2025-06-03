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

### Exemplo 3: Relatórios Separados por Tipo (Mesa vs Delivery)
```javascript
// POST /api/reports/vendas-por-tipo
router.post('/vendas-por-tipo', async (req, res) => {
  try {
    const { start_date, end_date, tipo_pedido } = req.body;
    const cacheKey = CacheKeys.REPORTS_SALES_BY_TYPE(start_date, end_date, tipo_pedido || 'all');
    
    const vendas = await cache.getOrFetch(cacheKey, async () => {
      let whereClause = 'WHERE data_pedido BETWEEN $1 AND $2 AND status_pedido != \'cancelado\'';
      const params = [start_date, end_date];
      
      if (tipo_pedido && ['mesa', 'delivery'].includes(tipo_pedido)) {
        whereClause += ' AND tipo_pedido = $3';
        params.push(tipo_pedido);
      }
      
      const result = await db.query(`
        SELECT 
          tipo_pedido,
          DATE(data_pedido) as data,
          COUNT(*) as total_pedidos,
          SUM(total) as vendas_totais,
          AVG(total) as ticket_medio,
          SUM(taxa_entrega) as total_taxas_entrega
        FROM pedidos
        ${whereClause}
        GROUP BY tipo_pedido, DATE(data_pedido)
        ORDER BY data, tipo_pedido
      `, params);
      
      return result.rows;
    }, 600); // Cache por 10 minutos
    
    res.json({ vendas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Exemplo 4: Fechamento de Caixa Integrado
```javascript
// POST /api/cash-closing com auto_generate
router.post('/fechamento-automatico', async (req, res) => {
  try {
    const { observacoes } = req.body;
    
    // Chama a API de fechamento com geração automática
    const response = await fetch('/api/cash-closing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auto_generate: true,
        observacoes: observacoes || 'Fechamento gerado automaticamente'
      })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Exemplo 5: Invalidação Automática ao Modificar Dados
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
    cache.deletePattern('reports:.*_by_type:.*'); // Relatórios por tipo
    
    res.status(201).json({ produto: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Testando as Novas Funcionalidades

### 1. Teste de Relatórios por Tipo
```bash
# Relatório de vendas separado por mesa
curl -X POST http://localhost:3000/api/reports/top-products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31", 
    "tipo_pedido": "mesa",
    "limit": 10
  }'

# Relatório comparativo mesa vs delivery
curl -X POST http://localhost:3000/api/reports/comparative \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }'
```

### 2. Teste de Fechamento Integrado
```bash
# Buscar dados atuais detalhados
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/cash-closing/current

# Resultado esperado:
# {
#   "cash_closing": {
#     "data_fechamento": "2024-01-15",
#     "details_by_type": [
#       {
#         "tipo_pedido": "delivery",
#         "total_pedidos": 25,
#         "vendas_brutas": 850.00,
#         "ticket_medio": 34.00
#       },
#       {
#         "tipo_pedido": "mesa", 
#         "total_pedidos": 15,
#         "vendas_brutas": 450.00,
#         "ticket_medio": 30.00
#       }
#     ]
#   }
# }

# Criar fechamento automático
curl -X POST http://localhost:3000/api/cash-closing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "auto_generate": true,
    "observacoes": "Fechamento automático do dia"
  }'
```

### 3. Monitoramento de Cache por Tipo
```bash
# Ver estatísticas específicas
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/cache-admin/stats

# Limpar apenas caches de relatórios por tipo
curl -X DELETE -H "Authorization: Bearer SEU_TOKEN" \
  "http://localhost:3000/api/cache-admin/pattern/reports.*_by_type.*"
```

## Padrões de Uso Recomendados

### 1. TTL por Tipo de Consulta e Separação
```javascript
// Dados em tempo real por tipo
const pedidosAtivosMesa = await cache.getOrFetch(
  CacheKeys.ORDERS_BY_TYPE('mesa', 'ativo'), 
  fetcher, 
  60 // 1 minuto
);

// Relatórios comparativos (mais estáveis)
const relatorioComparativo = await cache.getOrFetch(
  CacheKeys.REPORTS_COMPARATIVE(start, end), 
  fetcher, 
  900 // 15 minutos
);

// Fechamento detalhado do dia atual
const fechamentoDetalhado = await cache.getOrFetch(
  CacheKeys.CASH_CLOSING_CURRENT_DETAILED(today), 
  fetcher, 
  120 // 2 minutos
);
```

### 2. Chaves de Cache Organizadas por Tipo
```javascript
// ✅ BOM: Separação clara por tipo
const chaves = {
  vendasMesa: CacheKeys.REPORTS_SALES_BY_TYPE(inicio, fim, 'mesa'),
  vendasDelivery: CacheKeys.REPORTS_SALES_BY_TYPE(inicio, fim, 'delivery'),
  comparativo: CacheKeys.REPORTS_COMPARATIVE(inicio, fim)
};

// ✅ BOM: Cache específico por preferência do cliente
const clientesMesa = CacheKeys.CUSTOMERS_BY_TYPE_PREFERENCE(inicio, fim);
```

### 3. Invalidação Inteligente por Tipo
```javascript
// ✅ BOM: Invalidação específica quando pedido mesa é criado
function invalidarCachesPedidoMesa(pedidoId) {
  cache.deletePattern('orders:type:mesa:.*');
  cache.deletePattern('reports:.*_by_type:.*:mesa:.*');
  cache.deletePattern('reports:comparative:.*');
  cache.delete(CacheKeys.CASH_CLOSING_CURRENT_DETAILED(today));
}

// ✅ BOM: Invalidação baseada no tipo alterado
function invalidarPorTipoAlterado(tipoAntigo, tipoNovo) {
  if (tipoAntigo) cache.deletePattern(`.*:${tipoAntigo}:.*`);
  if (tipoNovo) cache.deletePattern(`.*:${tipoNovo}:.*`);
  cache.deletePattern('reports:comparative:.*');
}
```

## Exemplos de Uso Frontend

### 1. Dashboard com Separação por Tipo
```javascript
// Buscar dados do dashboard com análise por tipo
const dashboardData = await fetch('/api/dashboard');
const data = await dashboardData.json();

// Processar dados por tipo se disponível
if (data.salesByType) {
  const mesaData = data.salesByType.find(s => s.tipo_pedido === 'mesa');
  const deliveryData = data.salesByType.find(s => s.tipo_pedido === 'delivery');
  
  console.log('Mesa:', mesaData);
  console.log('Delivery:', deliveryData);
}
```

### 2. Relatório Comparativo
```javascript
// Buscar relatório comparativo
const comparative = await fetch('/api/reports/comparative', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  })
});

const result = await comparative.json();

// Usar dados comparativos
const { comparative: data, hourlyBreakdown, productPreferences } = result.report;
```

### 3. Fechamento com Análise Detalhada
```javascript
// Buscar dados de fechamento com detalhes por tipo
const currentData = await fetch('/api/cash-closing/current');
const { cash_closing } = await currentData.json();

// Exibir análise por tipo
cash_closing.details_by_type?.forEach(detail => {
  console.log(`${detail.tipo_pedido}: ${detail.total_pedidos} pedidos, R$ ${detail.vendas_brutas}`);
});

// Realizar fechamento automático
const fechamento = await fetch('/api/cash-closing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    auto_generate: true,
    observacoes: 'Fechamento via interface'
  })
});
```

## Debug e Troubleshooting das Novas Funcionalidades

### 1. Logs Específicos por Tipo
```javascript
// Ativar logs específicos para relatórios por tipo
console.log(`🎯 Cache HIT para tipo mesa: ${key}`);
console.log(`📊 Relatório comparativo gerado: ${key}`);
console.log(`💰 Fechamento detalhado criado: ${key}`);
```

### 2. Verificação de Cache por Padrão
```javascript
// Verificar caches de um tipo específico
const stats = cache.getStats();
const cachesDelivery = stats.keys.filter(key => key.includes('delivery'));
const cachesComparativos = stats.keys.filter(key => key.includes('comparative'));

console.log('Caches Delivery:', cachesDelivery);
console.log('Caches Comparativos:', cachesComparativos);
```

### 3. Health Check Específico
```javascript
// GET /api/health-cache-types
router.get('/health-cache-types', async (req, res) => {
  const stats = cache.getStats();
  
  const typeBreakdown = {
    mesa: stats.keys.filter(k => k.includes('mesa')).length,
    delivery: stats.keys.filter(k => k.includes('delivery')).length,
    comparative: stats.keys.filter(k => k.includes('comparative')).length,
    detailed: stats.keys.filter(k => k.includes('detailed')).length
  };
  
  res.json({
    status: 'OK',
    totalItems: stats.totalItems,
    typeBreakdown,
    timestamp: new Date().toISOString()
  });
});
```

## Métricas e Monitoramento das Novas Funcionalidades

### 1. Hit Rate por Tipo de Relatório
```javascript
let cacheHitsByType = {
  mesa: { hits: 0, misses: 0 },
  delivery: { hits: 0, misses: 0 },
  comparative: { hits: 0, misses: 0 }
};

// Contar hits por tipo
function trackCacheByType(key, hit) {
  if (key.includes('mesa')) {
    cacheHitsByType.mesa[hit ? 'hits' : 'misses']++;
  } else if (key.includes('delivery')) {
    cacheHitsByType.delivery[hit ? 'hits' : 'misses']++;
  } else if (key.includes('comparative')) {
    cacheHitsByType.comparative[hit ? 'hits' : 'misses']++;
  }
}
```

### 2. Alertas de Performance por Tipo
```javascript
// Alertar se algum tipo específico tem hit rate baixo
setInterval(() => {
  Object.entries(cacheHitsByType).forEach(([type, stats]) => {
    const total = stats.hits + stats.misses;
    if (total > 20) {
      const hitRate = stats.hits / total;
      if (hitRate < 0.6) {
        console.warn(`⚠️ Hit rate baixo para tipo ${type}: ${(hitRate * 100).toFixed(2)}%`);
      }
    }
  });
}, 300000); // Verificar a cada 5 minutos
``` 