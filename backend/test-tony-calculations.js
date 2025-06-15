const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pizzaria_db',
  user: 'postgres',
  password: '8477'
});

async function testTonyCalculations() {
  try {
    console.log('🧮 Testando cálculos da área do Tony...');
    
    const hoje = new Date().toISOString().split('T')[0];
    console.log('📅 Data de teste:', hoje);
    
    // 1. Verificar se existem pedidos mesa e delivery hoje
    const pedidosResult = await pool.query(`
      SELECT 
        tipo_pedido,
        status_pedido,
        COUNT(*) as quantidade,
        COALESCE(SUM(total), 0) as valor_total
      FROM pedidos 
      WHERE DATE(data_pedido) = $1
      GROUP BY tipo_pedido, status_pedido
      ORDER BY tipo_pedido, status_pedido
    `, [hoje]);
    
    console.log('\n📊 Pedidos encontrados hoje:');
    if (pedidosResult.rows.length === 0) {
      console.log('❌ Nenhum pedido encontrado hoje');
      console.log('💡 Sugestão: Crie alguns pedidos de teste (mesa e delivery)');
    } else {
      pedidosResult.rows.forEach(row => {
        console.log(`- ${row.tipo_pedido} (${row.status_pedido}): ${row.quantidade} pedidos = R$ ${parseFloat(row.valor_total).toFixed(2)}`);
      });
    }
    
    // 2. Testar endpoint consolidado usado pelo Tony
    console.log('\n📡 Testando endpoint /api/dashboard/fechamento-consolidado...');
    
    const response = await fetch(`http://localhost:3001/api/dashboard/fechamento-consolidado?data_inicio=${hoje}&data_fim=${hoje}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5ODcwNzEsImV4cCI6MTc1MDA3MzQ3MX0.2QsiwzFvygnjwsF9Ue-q-MvbVTEh63b51EY_iXIyMII',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Erro no endpoint:', data);
      return;
    }
    
    console.log('✅ Endpoint funcionando!');
    
    // 3. Verificar dados por tipo
    console.log('\n💰 Vendas por tipo:');
    if (data.vendas_por_tipo) {
      Object.entries(data.vendas_por_tipo).forEach(([tipo, vendas]) => {
        console.log(`${tipo.toUpperCase()}:`);
        console.log(`  - Pedidos: ${vendas.total_pedidos}`);
        console.log(`  - Vendas brutas: R$ ${vendas.vendas_brutas.toFixed(2)}`);
        console.log(`  - Ticket médio: R$ ${vendas.ticket_medio.toFixed(2)}`);
        console.log(`  - Taxas entrega: R$ ${vendas.total_taxas_entrega.toFixed(2)}`);
      });
    }
    
    // 4. Verificar totais gerais
    console.log('\n🎯 Totais gerais:');
    if (data.totais_gerais) {
      console.log(`- Total pedidos: ${data.totais_gerais.total_pedidos}`);
      console.log(`- Vendas brutas: R$ ${data.totais_gerais.vendas_brutas.toFixed(2)}`);
      console.log(`- Vendas líquidas: R$ ${data.totais_gerais.vendas_liquidas.toFixed(2)}`);
      console.log(`- Taxas de entrega: R$ ${data.totais_gerais.total_taxas_entrega.toFixed(2)}`);
    }
    
    // 5. Verificar mesas abertas
    console.log('\n🍽️ Mesas abertas:');
    if (data.mesas_abertas && data.mesas_abertas.length > 0) {
      data.mesas_abertas.forEach(mesa => {
        console.log(`- Mesa ${mesa.numero_mesa}: ${mesa.status_pedido} - R$ ${mesa.valor_pendente.toFixed(2)}`);
      });
    } else {
      console.log('✅ Nenhuma mesa aberta no momento');
    }
    
    // 6. Resumo final
    console.log('\n📋 RESUMO PARA TONY:');
    const mesaVendas = data.vendas_por_tipo?.mesa?.vendas_brutas || 0;
    const deliveryVendas = data.vendas_por_tipo?.delivery?.vendas_brutas || 0;
    const totalVendas = mesaVendas + deliveryVendas;
    
    console.log(`✅ Mesa: R$ ${mesaVendas.toFixed(2)}`);
    console.log(`✅ Delivery: R$ ${deliveryVendas.toFixed(2)}`);
    console.log(`🎯 TOTAL: R$ ${totalVendas.toFixed(2)}`);
    
    if (totalVendas > 0) {
      console.log('\n🎉 EXCELENTE! Pedidos de mesa e delivery estão sendo incluídos nos cálculos da área do Tony!');
    } else {
      console.log('\n💡 Crie alguns pedidos de teste para verificar os cálculos');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    await pool.end();
  }
}

testTonyCalculations();