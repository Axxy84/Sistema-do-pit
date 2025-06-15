const db = require('./config/database');

async function testFinancialIntegration() {
  console.log('🧪 Testando integração financeira...\n');

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Testar endpoint de summary
    console.log('1️⃣ Testando endpoint /api/expenses/summary...');
    const fetch = await import('node-fetch').then(m => m.default);
    
    // Fazer login primeiro
    const loginResponse = await fetch('http://localhost:3001/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pizzaria.com',
        password: 'admin123'
      })
    });
    
    const { token } = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    
    // Testar endpoint summary
    const summaryResponse = await fetch(`http://localhost:3001/api/expenses/summary?data_inicio=${today}&data_fim=${today}`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const summaryData = await summaryResponse.json();
    console.log('\n📊 Dados do summary:');
    console.table(summaryData.summary);
    
    // 2. Verificar dados diretamente no banco
    console.log('\n2️⃣ Verificando dados no banco de dados...');
    
    const pedidosResult = await db.query(`
      SELECT 
        COUNT(*) as quantidade,
        SUM(total) as total,
        status_pedido,
        tipo_pedido
      FROM pedidos
      WHERE DATE(data_pedido) = $1
        AND status_pedido IN ('entregue', 'fechada')
      GROUP BY status_pedido, tipo_pedido;
    `, [today]);
    
    console.log('\n📦 Pedidos finalizados hoje:');
    console.table(pedidosResult.rows);
    
    const transacoesResult = await db.query(`
      SELECT 
        tipo,
        COUNT(*) as quantidade,
        SUM(valor) as total
      FROM transacoes
      WHERE data_transacao = $1
      GROUP BY tipo;
    `, [today]);
    
    console.log('\n💰 Transações hoje:');
    console.table(transacoesResult.rows);
    
    const despesasResult = await db.query(`
      SELECT 
        tipo,
        COUNT(*) as quantidade,
        SUM(valor) as total
      FROM despesas_receitas
      WHERE DATE(data_transacao) = $1
      GROUP BY tipo;
    `, [today]);
    
    console.log('\n📋 Despesas/Receitas hoje:');
    console.table(despesasResult.rows);
    
    // 3. Validar integração
    console.log('\n3️⃣ Validando integração...');
    
    const totalPedidosDB = pedidosResult.rows.reduce((sum, row) => sum + parseFloat(row.total || 0), 0);
    const totalTransacoesDB = transacoesResult.rows
      .filter(row => row.tipo === 'venda')
      .reduce((sum, row) => sum + parseFloat(row.total || 0), 0);
    
    console.log(`\n📊 RESUMO DA VALIDAÇÃO:`);
    console.log(`====================================`);
    console.log(`Total de pedidos finalizados: R$ ${totalPedidosDB.toFixed(2)}`);
    console.log(`Total em transações de venda: R$ ${totalTransacoesDB.toFixed(2)}`);
    console.log(`Total de vendas no summary: R$ ${(summaryData.summary?.total_vendas || 0).toFixed(2)}`);
    console.log(`Total geral de receitas: R$ ${(summaryData.summary?.total_receitas_geral || 0).toFixed(2)}`);
    console.log(`Saldo calculado: R$ ${(summaryData.summary?.saldo || 0).toFixed(2)}`);
    
    if (Math.abs(totalPedidosDB - totalTransacoesDB) < 0.01) {
      console.log('\n✅ Pedidos e transações estão sincronizados!');
    } else {
      console.log('\n⚠️  ATENÇÃO: Diferença entre pedidos e transações!');
    }
    
    if (summaryData.summary?.total_vendas > 0) {
      console.log('✅ Vendas estão sendo incluídas no summary!');
    } else {
      console.log('❌ Vendas NÃO estão aparecendo no summary!');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  } finally {
    process.exit();
  }
}

testFinancialIntegration();