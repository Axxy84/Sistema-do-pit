/**
 * Script para limpar o cache do dashboard
 * Executa diretamente através do Node.js
 */

const db = require('./config/database');
const cache = require('./cache/cache-manager');
const { CacheKeys } = require('./cache/cache-keys');

async function limparCacheDashboard() {
  console.log('='.repeat(50));
  console.log('LIMPEZA DO CACHE DO DASHBOARD');
  console.log('='.repeat(50));

  try {
    // Limpar todo o cache relacionado ao dashboard
    cache.deletePattern(CacheKeys.PATTERNS.DASHBOARD);
    console.log('✅ Cache do dashboard limpo com sucesso!');
    
    // Mostrar estatísticas do cache após limpeza
    const stats = cache.getStats();
    console.log(`📊 Estatísticas do cache após limpeza:`);
    console.log(`   - Total de itens: ${stats.totalItems}`);
    console.log(`   - Chaves restantes: ${JSON.stringify(stats.keys)}`);
    
    console.log('\n✅ Processo concluído com sucesso!');
    console.log('Reinicie o servidor backend para garantir que o cache seja completamente limpo.');
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  } finally {
    // Fechar conexão com o banco de dados
    await db.end();
    process.exit(0);
  }
}

// Executar a função principal
limparCacheDashboard(); 