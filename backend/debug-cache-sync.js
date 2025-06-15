const cache = require('./cache/cache-manager');
const { CacheKeys } = require('./cache/cache-keys');

async function debugCacheSync() {
  console.log('🔍 Verificando sistema de cache e sincronização\n');

  try {
    // 1. Verificar estado atual do cache
    console.log('📦 Estado atual do cache:');
    const cacheStats = cache.getStats();
    console.log(`   Total de chaves: ${cacheStats.keys}`);
    console.log(`   Taxa de acerto: ${cacheStats.hitRate}%`);
    console.log(`   Memória usada: ${(cacheStats.vsize / 1024 / 1024).toFixed(2)} MB\n`);

    // 2. Listar chaves relacionadas ao fechamento de caixa
    console.log('🔑 Chaves de cache relacionadas ao fechamento:');
    const today = new Date().toISOString().split('T')[0];
    
    const relevantKeys = [
      `cash_closing_current_${today}`,
      `dashboard_day`,
      `dashboard_week`,
      `dashboard_month`,
      `orders_list`,
      `cash_closing_list`
    ];

    for (const key of relevantKeys) {
      const value = cache.get(key);
      if (value !== undefined) {
        console.log(`   ✅ ${key}: Em cache (TTL restante: ${cache.getTtl(key) || 'N/A'})`);
      } else {
        console.log(`   ❌ ${key}: Não está em cache`);
      }
    }

    // 3. Verificar invalidação de cache
    console.log('\n🔄 Testando invalidação de cache:');
    
    // Simular mudança de status de pedido
    console.log('   1. Simulando mudança de status de pedido...');
    const orderRelatedKeys = [
      'orders_*',
      'dashboard_*',
      'cash_closing_*'
    ];
    
    console.log('   2. Chaves que DEVEM ser invalidadas:');
    orderRelatedKeys.forEach(pattern => {
      console.log(`      - ${pattern}`);
    });

    // 4. Verificar configuração de TTL
    console.log('\n⏱️  Configuração de TTL (Time To Live):');
    console.log('   - Dashboard: 2 minutos');
    console.log('   - Orders List: 30 segundos');
    console.log('   - Cash Closing Current: 1 minuto');
    console.log('   - Cash Closing List: 10 minutos');

    // 5. Sugestões de debug
    console.log('\n💡 SUGESTÕES PARA DEBUG:\n');
    
    console.log('1. LIMPAR CACHE MANUALMENTE:');
    console.log('   - No navegador: Abra DevTools → Application → Clear Storage');
    console.log('   - No backend: Reinicie o servidor ou use o endpoint /api/cache-admin/clear\n');
    
    console.log('2. VERIFICAR INVALIDAÇÃO AUTOMÁTICA:');
    console.log('   - Abra backend/routes/orders.js');
    console.log('   - Procure por cache.invalidatePattern');
    console.log('   - Confirme que está invalidando após updateOrderStatus\n');
    
    console.log('3. TESTAR SEM CACHE:');
    console.log('   - Adicione ?nocache=true nas URLs da API');
    console.log('   - Ou desabilite temporariamente o cache no backend\n');
    
    console.log('4. MONITORAR EVENTOS NO FRONTEND:');
    console.log('   - No console do navegador, execute:');
    console.log(`   window.addEventListener('orderDelivered', (e) => console.log('EVENTO:', e.detail));`);
    console.log(`   window.addEventListener('cashUpdated', (e) => console.log('CASH:', e.detail));\n`);

    // 6. Verificar se há problemas conhecidos
    console.log('⚠️  PROBLEMAS CONHECIDOS:\n');
    
    console.log('1. DELAY NA ATUALIZAÇÃO:');
    console.log('   - Há um delay intencional de 500ms-1000ms nos listeners');
    console.log('   - Isso garante que o backend processe antes da atualização\n');
    
    console.log('2. CACHE DESATUALIZADO:');
    console.log('   - Se o cache não invalida corretamente, dados antigos persistem');
    console.log('   - Solução: Verificar invalidatePattern nas rotas\n');
    
    console.log('3. EVENTOS NÃO DISPARADOS:');
    console.log('   - Se os eventos não chegam, verificar OrdersList.jsx');
    console.log('   - Confirmar que window.dispatchEvent está sendo chamado');

    // 7. Script para forçar limpeza de cache
    console.log('\n🧹 COMANDO PARA LIMPAR CACHE DO FECHAMENTO:');
    console.log('   curl -X POST http://localhost:3001/api/cache-admin/clear \\');
    console.log('     -H "Authorization: Bearer SEU_TOKEN" \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"pattern": "cash_closing_*"}\'');

  } catch (error) {
    console.error('❌ Erro ao verificar cache:', error.message);
  }
}

console.log('='.repeat(80));
console.log('DEBUG: SISTEMA DE CACHE E SINCRONIZAÇÃO');
console.log('='.repeat(80));

debugCacheSync();