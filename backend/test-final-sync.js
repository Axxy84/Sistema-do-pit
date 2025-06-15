const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pizzaria_db',
  user: 'postgres',
  password: '8477'
});

async function testFinalSync() {
  try {
    console.log('🎯 TESTE FINAL DE SINCRONIZAÇÃO');
    console.log('=====================================');
    
    const hoje = new Date().toISOString().split('T')[0];
    const JWT_SECRET = 'sua_chave_secreta_muito_forte_aqui_change_me';
    const token = jwt.sign(
      { userId: '99a62b24-7acd-4bd0-a84c-9ee2164cec26' }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // 1. Verificar dados no banco
    console.log('\n1️⃣ DADOS NO BANCO:');
    
    const pedidosHoje = await pool.query(`
      SELECT 
        tipo_pedido,
        status_pedido,
        COUNT(*) as quantidade,
        SUM(total) as valor_total
      FROM pedidos 
      WHERE data_pedido::date = CURRENT_DATE
      AND status_pedido IN ('entregue', 'fechada')
      GROUP BY tipo_pedido, status_pedido
      ORDER BY tipo_pedido
    `);
    
    console.log('📊 Pedidos finalizados hoje:');
    let totalPedidosDB = 0;
    let totalVendasDB = 0;
    
    if (pedidosHoje.rows.length === 0) {
      console.log('❌ Nenhum pedido finalizado encontrado hoje');
    } else {
      pedidosHoje.rows.forEach(row => {
        console.log(`- ${row.tipo_pedido} (${row.status_pedido}): ${row.quantidade} pedidos = R$ ${parseFloat(row.valor_total).toFixed(2)}`);
        totalPedidosDB += parseInt(row.quantidade);
        totalVendasDB += parseFloat(row.valor_total);
      });
    }
    
    // 2. Testar endpoint consolidado
    console.log('\n2️⃣ ENDPOINT CONSOLIDADO:');
    
    const response = await fetch(`http://localhost:3001/api/dashboard/fechamento-consolidado?data_inicio=${hoje}&data_fim=${hoje}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('❌ Erro na API:', response.status);
      return;
    }
    
    const data = await response.json();
    
    console.log('📡 Resposta da API:');
    console.log(`- Total pedidos: ${data.totais_gerais?.total_pedidos || 0}`);
    console.log(`- Vendas brutas: R$ ${(data.totais_gerais?.vendas_brutas || 0).toFixed(2)}`);
    
    if (data.vendas_por_tipo) {
      console.log('\n📋 Detalhamento por tipo:');
      Object.entries(data.vendas_por_tipo).forEach(([tipo, vendas]) => {
        console.log(`- ${tipo}: ${vendas.total_pedidos} pedidos = R$ ${vendas.vendas_brutas.toFixed(2)}`);
      });
    }
    
    // 3. Comparar dados
    console.log('\n3️⃣ COMPARAÇÃO:');
    
    const totalPedidosAPI = data.totais_gerais?.total_pedidos || 0;
    const totalVendasAPI = data.totais_gerais?.vendas_brutas || 0;
    
    console.log(`Banco: ${totalPedidosDB} pedidos, R$ ${totalVendasDB.toFixed(2)}`);
    console.log(`API:   ${totalPedidosAPI} pedidos, R$ ${totalVendasAPI.toFixed(2)}`);
    
    if (totalPedidosDB === totalPedidosAPI && Math.abs(totalVendasDB - totalVendasAPI) < 0.01) {
      console.log('✅ SINCRONIZAÇÃO PERFEITA!');
    } else {
      console.log('❌ DADOS DESATUALIZADOS!');
      console.log('💡 Solução: Limpar cache e tentar novamente');
      
      // Limpar cache
      const clearResponse = await fetch('http://localhost:3001/api/cache-admin/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (clearResponse.ok) {
        console.log('🧹 Cache limpo com sucesso');
      }
    }
    
    // 4. Instruções para o usuário
    console.log('\n4️⃣ INSTRUÇÕES:');
    console.log('📱 Para testar a sincronização:');
    console.log('1. Abra a área do Tony: http://localhost:5173/tony');
    console.log('2. Crie um novo pedido na tela de pedidos');
    console.log('3. Finalize o pedido (status entregue/fechada)');
    console.log('4. Observe o toast "🔄 Atualizando dados..." na área Tony');
    console.log('5. Os valores devem atualizar automaticamente!');
    
    console.log('\n🔧 Se não funcionar:');
    console.log('- Clique no botão "Atualizar" na área Tony');
    console.log('- Verifique o console do navegador para eventos');
    console.log('- Aguarde até 30 segundos para atualização automática');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    await pool.end();
  }
}

testFinalSync();