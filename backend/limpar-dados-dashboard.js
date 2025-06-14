require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function limparDadosDashboard() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔄 Iniciando limpeza dos dados do dashboard...\n');
    
    // Iniciar uma transação para garantir que todas as operações sejam concluídas ou nenhuma
    await client.query('BEGIN');
    
    // 1. Verificar quantidade de pedidos antes da limpeza
    const pedidosAntesResult = await client.query('SELECT COUNT(*) FROM pedidos');
    const pedidosAntes = parseInt(pedidosAntesResult.rows[0].count);
    console.log(`📊 Total de pedidos antes da limpeza: ${pedidosAntes}`);
    
    // 2. Verificar quantidade de fechamentos de caixa antes da limpeza
    const fechamentosAntesResult = await client.query('SELECT COUNT(*) FROM fechamento_caixa');
    const fechamentosAntes = parseInt(fechamentosAntesResult.rows[0].count);
    console.log(`📊 Total de fechamentos de caixa antes da limpeza: ${fechamentosAntes}`);
    
    // 3. Limpar itens de pedido (devido à restrição de chave estrangeira)
    console.log('\n🗑️ Removendo itens de pedido...');
    const deleteItensResult = await client.query('DELETE FROM itens_pedido');
    console.log(`✅ Itens de pedido removidos: ${deleteItensResult.rowCount}`);
    
    // 4. Limpar pagamentos de pedido (se existir a tabela)
    try {
      console.log('\n🗑️ Removendo pagamentos de pedido...');
      const deletePagamentosResult = await client.query('DELETE FROM pagamentos_pedido');
      console.log(`✅ Pagamentos de pedido removidos: ${deletePagamentosResult.rowCount}`);
    } catch (error) {
      console.log('ℹ️ Tabela pagamentos_pedido não existe ou está vazia');
    }
    
    // 5. Limpar pedidos
    console.log('\n🗑️ Removendo pedidos...');
    const deletePedidosResult = await client.query('DELETE FROM pedidos');
    console.log(`✅ Pedidos removidos: ${deletePedidosResult.rowCount}`);
    
    // 6. Limpar fechamentos de caixa
    console.log('\n🗑️ Removendo fechamentos de caixa...');
    const deleteFechamentosResult = await client.query('DELETE FROM fechamento_caixa');
    console.log(`✅ Fechamentos de caixa removidos: ${deleteFechamentosResult.rowCount}`);
    
    // 7. Limpar o cache do dashboard (se existir a tabela)
    try {
      console.log('\n🗑️ Limpando cache do dashboard...');
      const deleteCacheResult = await client.query("DELETE FROM cache WHERE key LIKE '%dashboard%'");
      console.log(`✅ Registros de cache removidos: ${deleteCacheResult.rowCount}`);
    } catch (error) {
      console.log('ℹ️ Tabela cache não existe ou não há registros de dashboard');
    }
    
    // Confirmar a transação
    await client.query('COMMIT');
    
    // Verificar resultados após a limpeza
    const pedidosDepoisResult = await client.query('SELECT COUNT(*) FROM pedidos');
    const pedidosDepois = parseInt(pedidosDepoisResult.rows[0].count);
    
    const fechamentosDepoisResult = await client.query('SELECT COUNT(*) FROM fechamento_caixa');
    const fechamentosDepois = parseInt(fechamentosDepoisResult.rows[0].count);
    
    console.log('\n📊 Resumo da limpeza:');
    console.log(`   • Pedidos antes: ${pedidosAntes} → depois: ${pedidosDepois}`);
    console.log(`   • Fechamentos antes: ${fechamentosAntes} → depois: ${fechamentosDepois}`);
    
    console.log('\n✅ Limpeza dos dados do dashboard concluída com sucesso!');
    console.log('🔄 Agora você pode testar os cálculos reais do dashboard.');
    
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('\n❌ Erro durante a limpeza dos dados:', error.message);
    console.error(error.stack);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

limparDadosDashboard(); 