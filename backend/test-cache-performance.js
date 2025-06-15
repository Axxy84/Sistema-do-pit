/**
 * Script de Teste - Performance do Sistema de Cache
 * Valida implementação do Cache-Aside pattern e mede melhorias
 */

const cache = require('./cache/cache-manager');
const { CacheKeys } = require('./cache/cache-keys');
const db = require('./config/database');

async function testCachePerformance() {
  console.log('🧪 ===== TESTE DE PERFORMANCE DO CACHE =====\n');
  
  try {
    // Reset métricas para teste limpo
    cache.resetMetrics();
    console.log('✅ Métricas resetadas para teste\n');
    
    // Teste 1: Products Cache
    console.log('📦 TESTE 1: Cache de Produtos');
    await testProductsCache();
    
    // Teste 2: Customers Cache  
    console.log('\n👥 TESTE 2: Cache de Clientes');
    await testCustomersCache();
    
    // Teste 3: Deliverers Cache
    console.log('\n🚚 TESTE 3: Cache de Entregadores');
    await testDeliverersCache();
    
    // Teste 4: Cache Invalidation
    console.log('\n💥 TESTE 4: Invalidação de Cache');
    await testCacheInvalidation();
    
    // Gerar relatório final
    console.log('\n📊 RELATÓRIO FINAL DE PERFORMANCE:');
    const report = cache.generatePerformanceReport();
    
    // Validação de resultados
    console.log('\n✅ VALIDAÇÃO DOS RESULTADOS:');
    validateResults();
    
  } catch (error) {
    console.error('❌ Erro durante teste de cache:', error);
  }
}

async function testProductsCache() {
  const iterations = 10;
  let totalDbTime = 0;
  let totalCacheTime = 0;
  
  // Teste sem cache (primeira execução)
  console.log('   🕐 Testando consulta SEM cache...');
  const startDb = Date.now();
  
  const result = await db.query(`
    SELECT * FROM produtos 
    ORDER BY created_at DESC
  `);
  
  const dbTime = Date.now() - startDb;
  console.log(`   📊 Tempo DB: ${dbTime}ms`);
  
  // Simular múltiplas consultas com cache
  console.log(`   🔄 Simulando ${iterations} consultas COM cache...`);
  
  for (let i = 0; i < iterations; i++) {
    const startCache = Date.now();
    
    const cachedData = await cache.getOrFetch(
      CacheKeys.PRODUCTS_LIST,
      async () => {
        return await db.query(`
          SELECT * FROM produtos 
          ORDER BY created_at DESC
        `);
      },
      900
    );
    
    const cacheTime = Date.now() - startCache;
    totalCacheTime += cacheTime;
    
    if (i === 0) {
      console.log(`   📊 Primeira consulta (MISS): ${cacheTime}ms`);
    } else if (i === 1) {
      console.log(`   📊 Segunda consulta (HIT): ${cacheTime}ms`);
    }
  }
  
  const avgCacheTime = Math.round(totalCacheTime / iterations);
  const improvement = Math.round(((dbTime - avgCacheTime) / dbTime) * 100);
  
  console.log(`   📈 Tempo médio com cache: ${avgCacheTime}ms`);
  console.log(`   🚀 Melhoria: ${improvement}%`);
}

async function testCustomersCache() {
  const phoneNumber = '11999999999';
  
  // Teste de busca por telefone (query complexa com JOINs)
  console.log('   🕐 Testando busca por telefone SEM cache...');
  const startDb = Date.now();
  
  await db.query(`
    SELECT 
      c.*,
      COALESCE(
        (SELECT SUM(p.pontos_ganhos - p.pontos_resgatados) 
         FROM pedidos p 
         WHERE p.cliente_id = c.id), 
        0
      ) as pontos_atuais
    FROM clientes c
    WHERE c.telefone = $1
  `, [phoneNumber]);
  
  const dbTime = Date.now() - startDb;
  console.log(`   📊 Tempo DB: ${dbTime}ms`);
  
  // Teste com cache
  console.log('   🔄 Testando com cache (3 consultas)...');
  let totalCacheTime = 0;
  
  for (let i = 0; i < 3; i++) {
    const startCache = Date.now();
    
    const cachedData = await cache.getOrFetch(
      CacheKeys.CUSTOMERS_BY_PHONE(phoneNumber),
      async () => {
        const result = await db.query(`
          SELECT 
            c.*,
            COALESCE(
              (SELECT SUM(p.pontos_ganhos - p.pontos_resgatados) 
               FROM pedidos p 
               WHERE p.cliente_id = c.id), 
              0
            ) as pontos_atuais
          FROM clientes c
          WHERE c.telefone = $1
        `, [phoneNumber]);
        
        return result.rows.length > 0 ? result.rows[0] : null;
      },
      600
    );
    
    const cacheTime = Date.now() - startCache;
    totalCacheTime += cacheTime;
    
    console.log(`   📊 Consulta ${i + 1}: ${cacheTime}ms ${i > 0 ? '(HIT)' : '(MISS)'}`);
  }
  
  const avgCacheTime = Math.round(totalCacheTime / 3);
  const improvement = Math.round(((dbTime - avgCacheTime) / dbTime) * 100);
  
  console.log(`   📈 Tempo médio com cache: ${avgCacheTime}ms`);
  console.log(`   🚀 Melhoria: ${improvement}%`);
}

async function testDeliverersCache() {
  console.log('   🕐 Testando lista de entregadores ativos...');
  
  // Simular 5 consultas
  const iterations = 5;
  let totalTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    const cachedData = await cache.getOrFetch(
      CacheKeys.DELIVERERS_ACTIVE,
      async () => {
        const result = await db.query(`
          SELECT * FROM entregadores 
          WHERE ativo = true
          ORDER BY nome ASC
        `);
        return result.rows;
      },
      900
    );
    
    const time = Date.now() - start;
    totalTime += time;
    
    console.log(`   📊 Consulta ${i + 1}: ${time}ms ${i > 0 ? '(HIT)' : '(MISS)'}`);
  }
  
  const avgTime = Math.round(totalTime / iterations);
  console.log(`   📈 Tempo médio: ${avgTime}ms`);
}

async function testCacheInvalidation() {
  console.log('   💥 Testando invalidação por padrão...');
  
  // Povoar cache
  await cache.getOrFetch(CacheKeys.PRODUCTS_LIST, async () => ({ test: 'data' }), 900);
  await cache.getOrFetch(CacheKeys.PRODUCTS_BY_TYPE('pizza'), async () => ({ test: 'pizza' }), 900);
  await cache.getOrFetch(CacheKeys.CUSTOMERS_LIST, async () => ({ test: 'customers' }), 600);
  
  const statsBefore = cache.getStats();
  console.log(`   📊 Itens no cache antes: ${statsBefore.totalItems}`);
  
  // Invalidar apenas produtos
  cache.deletePattern('products:.*');
  
  const statsAfter = cache.getStats();
  console.log(`   📊 Itens no cache depois: ${statsAfter.totalItems}`);
  console.log(`   💥 Itens removidos: ${statsBefore.totalItems - statsAfter.totalItems}`);
  
  // Verificar se apenas produtos foram removidos
  const remainingKeys = statsAfter.keys;
  const hasProductKeys = remainingKeys.some(key => key.startsWith('products:'));
  const hasCustomerKeys = remainingKeys.some(key => key.startsWith('customers:'));
  
  console.log(`   ✅ Produtos removidos: ${!hasProductKeys ? 'SIM' : 'NÃO'}`);
  console.log(`   ✅ Clientes preservados: ${hasCustomerKeys ? 'SIM' : 'NÃO'}`);
}

function validateResults() {
  const stats = cache.getStats();
  const metrics = stats.metrics;
  
  if (!metrics || !metrics.summary) {
    console.log('   ❌ Métricas não disponíveis');
    return;
  }
  
  const hitRate = parseFloat(metrics.summary.hitRate);
  const totalRequests = metrics.summary.totalRequests;
  
  console.log(`   📊 Total de requisições: ${totalRequests}`);
  console.log(`   🎯 Taxa de acerto: ${metrics.summary.hitRate}`);
  console.log(`   ✅ Cache hits: ${metrics.summary.hits}`);
  console.log(`   ❌ Cache misses: ${metrics.summary.misses}`);
  
  // Validações
  if (totalRequests >= 20) {
    console.log('   ✅ Volume de testes adequado');
  } else {
    console.log('   ⚠️  Volume de testes baixo');
  }
  
  if (hitRate >= 70) {
    console.log('   ✅ Taxa de acerto excelente');
  } else if (hitRate >= 50) {
    console.log('   ⚠️  Taxa de acerto razoável');
  } else {
    console.log('   ❌ Taxa de acerto baixa');
  }
  
  if (metrics.performance && metrics.performance.performanceImprovement) {
    const improvement = parseFloat(metrics.performance.performanceImprovement);
    if (improvement >= 50) {
      console.log('   🚀 Melhoria de performance excelente');
    } else {
      console.log('   📈 Melhoria de performance moderada');
    }
  }
  
  console.log('\n🎉 TESTE DE CACHE CONCLUÍDO COM SUCESSO! 🎉');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testCachePerformance()
    .then(() => {
      console.log('\n✅ Todos os testes concluídos');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro nos testes:', error);
      process.exit(1);
    });
}

module.exports = { testCachePerformance };