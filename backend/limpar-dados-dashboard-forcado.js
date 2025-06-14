require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function limparDadosDashboardForcado() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔄 Iniciando limpeza FORÇADA dos dados do dashboard...\n');
    
    // Iniciar uma transação para garantir que todas as operações sejam concluídas ou nenhuma
    await client.query('BEGIN');
    
    // 1. Desativar temporariamente as restrições de chave estrangeira
    console.log('🔓 Desativando restrições de chave estrangeira...');
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    
    // 2. Verificar todas as tabelas relacionadas ao dashboard
    console.log('\n📊 Verificando tabelas antes da limpeza:');
    
    const tabelas = [
      'pedidos', 
      'itens_pedido', 
      'pagamentos_pedido', 
      'fechamento_caixa',
      'despesas_receitas'
    ];
    
    for (const tabela of tabelas) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tabela}`);
        console.log(`   • ${tabela}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`   • ${tabela}: Tabela não existe ou erro ao acessar`);
      }
    }
    
    // 3. Limpar cache do dashboard (se existir)
    try {
      console.log('\n🗑️ Limpando cache do dashboard...');
      await client.query("DELETE FROM cache WHERE key LIKE '%dashboard%'");
      console.log('✅ Cache do dashboard limpo');
    } catch (error) {
      console.log('ℹ️ Tabela cache não existe ou não há registros de dashboard');
    }
    
    // 4. Truncar tabelas em ordem para evitar problemas de chave estrangeira
    console.log('\n🗑️ Truncando tabelas (modo FORÇADO):');
    
    // Primeiro as tabelas dependentes
    try {
      await client.query('TRUNCATE TABLE itens_pedido CASCADE');
      console.log('✅ Tabela itens_pedido truncada');
    } catch (error) {
      console.log(`❌ Erro ao truncar itens_pedido: ${error.message}`);
    }
    
    try {
      await client.query('TRUNCATE TABLE pagamentos_pedido CASCADE');
      console.log('✅ Tabela pagamentos_pedido truncada');
    } catch (error) {
      console.log(`ℹ️ Tabela pagamentos_pedido não existe ou erro: ${error.message}`);
    }
    
    // Depois as tabelas principais
    try {
      await client.query('TRUNCATE TABLE pedidos CASCADE');
      console.log('✅ Tabela pedidos truncada');
    } catch (error) {
      console.log(`❌ Erro ao truncar pedidos: ${error.message}`);
      
      // Tentar método alternativo
      try {
        await client.query('DELETE FROM pedidos');
        console.log('✅ Registros de pedidos deletados (método alternativo)');
      } catch (innerError) {
        console.log(`❌ Erro ao deletar pedidos: ${innerError.message}`);
      }
    }
    
    try {
      await client.query('TRUNCATE TABLE fechamento_caixa CASCADE');
      console.log('✅ Tabela fechamento_caixa truncada');
    } catch (error) {
      console.log(`❌ Erro ao truncar fechamento_caixa: ${error.message}`);
      
      // Tentar método alternativo
      try {
        await client.query('DELETE FROM fechamento_caixa');
        console.log('✅ Registros de fechamento_caixa deletados (método alternativo)');
      } catch (innerError) {
        console.log(`❌ Erro ao deletar fechamento_caixa: ${innerError.message}`);
      }
    }
    
    // 5. Limpar dados de vendas e estatísticas
    try {
      await client.query('TRUNCATE TABLE despesas_receitas CASCADE');
      console.log('✅ Tabela despesas_receitas truncada');
    } catch (error) {
      console.log(`ℹ️ Tabela despesas_receitas não existe ou erro: ${error.message}`);
      
      // Tentar método alternativo
      try {
        await client.query('DELETE FROM despesas_receitas');
        console.log('✅ Registros de despesas_receitas deletados (método alternativo)');
      } catch (innerError) {
        console.log(`ℹ️ Erro ou tabela não existe: ${innerError.message}`);
      }
    }
    
    // 6. Restaurar as restrições de chave estrangeira
    console.log('\n🔒 Restaurando restrições de chave estrangeira...');
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    
    // Confirmar a transação
    await client.query('COMMIT');
    
    // 7. Verificar resultado final
    console.log('\n📊 Verificando tabelas após a limpeza:');
    
    for (const tabela of tabelas) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tabela}`);
        console.log(`   • ${tabela}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`   • ${tabela}: Tabela não existe ou erro ao acessar`);
      }
    }
    
    console.log('\n✅ Limpeza FORÇADA dos dados do dashboard concluída!');
    console.log('🔄 Agora você pode testar os cálculos reais do dashboard.');
    console.log('⚠️ IMPORTANTE: Reinicie o servidor backend para limpar o cache em memória!');
    
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

limparDadosDashboardForcado(); 