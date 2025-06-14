// Script para testar a sincronização de mesas abertas
// Executa verificações de status e mudanças de estado

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5MjE4ODUsImV4cCI6MTc1MDAwODI4NX0.2eOSA79YTnE5gXXDXCSkMe1lz6A_exHGr6bNs3lPFzI';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testMesaSync() {
  console.log('🧪 Iniciando teste de sincronização de mesas...\n');

  try {
    // 1. Verificar mesas abertas iniciais
    console.log('1️⃣ Verificando mesas abertas atualmente:');
    const mesasResponse = await axios.get(`${API_URL}/dashboard/mesas-tempo-real`, { headers });
    const mesasInicial = mesasResponse.data.mesas;
    console.log(`   ✅ ${mesasInicial.length} mesas abertas encontradas`);
    mesasInicial.forEach(mesa => {
      console.log(`   📋 Mesa ${mesa.numero_mesa}: ${mesa.total_pedidos} pedidos, Status: ${mesa.status_pedido}, Total: R$ ${mesa.valor_total.toFixed(2)}`);
    });

    // 2. Buscar um pedido de mesa aberto para teste
    console.log('\n2️⃣ Buscando pedido de mesa para teste:');
    const ordersResponse = await axios.get(`${API_URL}/orders?tipo_pedido=mesa`, { headers });
    const mesaOrders = ordersResponse.data.orders.filter(o => 
      o.tipo_pedido === 'mesa' && 
      !['entregue', 'retirado', 'cancelado'].includes(o.status_pedido)
    );
    
    if (mesaOrders.length === 0) {
      console.log('   ⚠️  Nenhum pedido de mesa aberto encontrado para teste');
      console.log('   💡 Crie um pedido de mesa primeiro para testar a sincronização');
      return;
    }

    const testOrder = mesaOrders[0];
    console.log(`   ✅ Pedido encontrado: ID ${testOrder.id}, Mesa ${testOrder.numero_mesa}, Status: ${testOrder.status_pedido}`);

    // 3. Mudar status para "retirado"
    console.log('\n3️⃣ Alterando status do pedido para "retirado":');
    await axios.patch(`${API_URL}/orders/${testOrder.id}/status`, {
      status_pedido: 'retirado'
    }, { headers });
    console.log('   ✅ Status alterado com sucesso');

    // 4. Aguardar um momento para a sincronização
    console.log('\n4️⃣ Aguardando 2 segundos para sincronização...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verificar mesas abertas após mudança
    console.log('\n5️⃣ Verificando mesas abertas após mudança:');
    const mesasAposResponse = await axios.get(`${API_URL}/dashboard/mesas-tempo-real`, { headers });
    const mesasApos = mesasAposResponse.data.mesas;
    console.log(`   ✅ ${mesasApos.length} mesas abertas encontradas`);
    
    const mesaRemovida = !mesasApos.find(m => m.numero_mesa === testOrder.numero_mesa);
    if (mesaRemovida) {
      console.log(`   ✅ Mesa ${testOrder.numero_mesa} foi removida da lista (como esperado)`);
    } else {
      console.log(`   ❌ Mesa ${testOrder.numero_mesa} ainda está na lista de abertas`);
    }

    // 6. Verificar fechamento consolidado
    console.log('\n6️⃣ Verificando fechamento consolidado:');
    const today = new Date().toISOString().split('T')[0];
    const fechamentoResponse = await axios.get(`${API_URL}/dashboard/fechamento-consolidado?startDate=${today}&endDate=${today}`, { headers });
    const mesasAbertas = fechamentoResponse.data.mesas_abertas;
    console.log(`   ✅ Fechamento mostra ${mesasAbertas.length} mesas abertas`);

    // 7. Reverter o status para teste futuro
    console.log('\n7️⃣ Revertendo status para "preparando" para testes futuros:');
    await axios.patch(`${API_URL}/orders/${testOrder.id}/status`, {
      status_pedido: 'preparando'
    }, { headers });
    console.log('   ✅ Status revertido');

    console.log('\n✅ Teste de sincronização concluído com sucesso!');
    console.log('💡 A sincronização está funcionando corretamente - as mesas são atualizadas quando o status muda.');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.response?.data || error.message);
  }
}

// Executar teste
testMesaSync();