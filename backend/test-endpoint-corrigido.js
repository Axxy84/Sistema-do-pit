const jwt = require('jsonwebtoken');

async function testCorrectedEndpoint() {
  try {
    const JWT_SECRET = 'sua_chave_secreta_muito_forte_aqui_change_me';
    const token = jwt.sign(
      { userId: '99a62b24-7acd-4bd0-a84c-9ee2164cec26' }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    const hoje = new Date().toISOString().split('T')[0];
    console.log('🧪 Testando endpoint corrigido...');
    console.log('📅 Data:', hoje);

    const response = await fetch(`http://localhost:3001/api/dashboard/fechamento-consolidado?data_inicio=${hoje}&data_fim=${hoje}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Erro:', data);
      return;
    }
    
    console.log('\n✅ Endpoint funcionando!');
    
    // Mostrar dados atualizados
    console.log('\n💰 Vendas por tipo (DADOS ATUALIZADOS):');
    if (data.vendas_por_tipo) {
      Object.entries(data.vendas_por_tipo).forEach(([tipo, vendas]) => {
        console.log(`${tipo.toUpperCase()}:`);
        console.log(`  - Pedidos: ${vendas.total_pedidos}`);
        console.log(`  - Vendas brutas: R$ ${vendas.vendas_brutas.toFixed(2)}`);
        console.log(`  - Ticket médio: R$ ${vendas.ticket_medio.toFixed(2)}`);
      });
    }
    
    console.log('\n🎯 Totais gerais:');
    if (data.totais_gerais) {
      console.log(`- Total pedidos: ${data.totais_gerais.total_pedidos}`);
      console.log(`- Vendas brutas: R$ ${data.totais_gerais.vendas_brutas.toFixed(2)}`);
      console.log(`- Vendas líquidas: R$ ${data.totais_gerais.vendas_liquidas.toFixed(2)}`);
    }
    
    // Verificar se pegou o pedido mais recente
    const totalPedidos = data.totais_gerais?.total_pedidos || 0;
    const totalVendas = data.totais_gerais?.vendas_brutas || 0;
    
    console.log('\n📊 RESULTADO:');
    if (totalPedidos >= 1 && totalVendas > 0) {
      console.log('🎉 SUCESSO! Pedido mais recente está sendo incluído!');
      console.log(`✅ ${totalPedidos} pedido(s) = R$ ${totalVendas.toFixed(2)}`);
    } else {
      console.log('❌ Pedido ainda não está aparecendo');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCorrectedEndpoint();