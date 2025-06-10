const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

const adminCredentials = {
  email: 'admin@pizzaria.com',
  password: 'admin123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, adminCredentials);
    authToken = response.data.token;
    console.log('✅ Login realizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function testDeliveryEndpoints() {
  console.log('\n🚚 TESTANDO ENDPOINTS DE DELIVERY PARA APP FLUTTER');
  console.log('=====================================================');

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // 1. Testar listagem de todos os pedidos delivery
  console.log('\n📋 1. Testando listagem de pedidos delivery...');
  try {
    const response = await axios.get(`${BASE_URL}/api/delivery/pedidos-delivery`, { headers });
    console.log(`✅ Total de pedidos: ${response.data.total}`);
    if (response.data.pedidos.length > 0) {
      console.log('📦 Primeiro pedido:');
      console.log(JSON.stringify(response.data.pedidos[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error.response?.data || error.message);
  }

  // 2. Testar busca por status específico
  console.log('\n🔍 2. Testando busca por status "pendente"...');
  try {
    const response = await axios.get(`${BASE_URL}/api/delivery/pedidos-por-status/pendente`, { headers });
    console.log(`✅ Pedidos pendentes: ${response.data.total}`);
  } catch (error) {
    console.error('❌ Erro ao buscar por status:', error.response?.data || error.message);
  }

  // 3. Testar estatísticas do dia
  console.log('\n📊 3. Testando estatísticas do dia...');
  try {
    const response = await axios.get(`${BASE_URL}/api/delivery/estatisticas`, { headers });
    console.log('✅ Estatísticas de hoje:');
    console.log(JSON.stringify(response.data.estatisticas_hoje, null, 2));
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error.response?.data || error.message);
  }

  // 4. Se houver pedidos, testar busca de pedido específico
  console.log('\n🔍 4. Testando busca de pedido específico...');
  try {
    // Primeiro, buscar um pedido qualquer
    const listResponse = await axios.get(`${BASE_URL}/api/delivery/pedidos-delivery`, { headers });
    
    if (listResponse.data.pedidos.length > 0) {
      const pedidoId = listResponse.data.pedidos[0].id;
      console.log(`📋 Buscando detalhes do pedido ${pedidoId}...`);
      
      const response = await axios.get(`${BASE_URL}/api/delivery/pedido/${pedidoId}`, { headers });
      console.log('✅ Pedido completo encontrado:');
      console.log(`- ID: ${response.data.pedido.id}`);
      console.log(`- Total: R$ ${response.data.pedido.total}`);
      console.log(`- Cliente: ${response.data.pedido.cliente.nome}`);
      console.log(`- Endereço: ${response.data.pedido.endereco}`);
      console.log(`- Itens: ${response.data.pedido.itens.length} produtos`);
    } else {
      console.log('ℹ️ Nenhum pedido encontrado para testar busca específica');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar pedido específico:', error.response?.data || error.message);
  }

  // 5. Testar atualização de status (se houver pedidos)
  console.log('\n📝 5. Testando atualização de status...');
  try {
    const listResponse = await axios.get(`${BASE_URL}/api/delivery/pedidos-delivery`, { headers });
    
    if (listResponse.data.pedidos.length > 0) {
      const pedidoId = listResponse.data.pedidos[0].id;
      console.log(`📋 Atualizando status do pedido ${pedidoId}...`);
      
      const updateData = {
        status: 'preparando',
        entregador_nome: 'João Motoqueiro (Teste)'
      };
      
      const response = await axios.put(`${BASE_URL}/api/delivery/pedido/${pedidoId}/status`, updateData, { headers });
      console.log('✅ Status atualizado com sucesso:');
      console.log(`- Pedido: ${response.data.pedido_id}`);
      console.log(`- Novo status: ${response.data.novo_status}`);
    } else {
      console.log('ℹ️ Nenhum pedido encontrado para testar atualização de status');
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error.response?.data || error.message);
  }

  console.log('\n🎯 RESUMO DOS ENDPOINTS PARA APP FLUTTER:');
  console.log('==========================================');
  console.log('📱 GET /api/delivery/pedidos-delivery - Listar todos os pedidos');
  console.log('📱 GET /api/delivery/pedido/{id} - Buscar pedido específico');
  console.log('📱 GET /api/delivery/pedidos-por-status/{status} - Filtrar por status');
  console.log('📱 PUT /api/delivery/pedido/{id}/status - Atualizar status');
  console.log('📱 GET /api/delivery/estatisticas - Estatísticas do dia');
  console.log('\n💡 Estes endpoints são simples e diretos para o app Flutter!');
}

async function main() {
  console.log('🧪 TESTE DOS ENDPOINTS DE DELIVERY FLUTTER');
  console.log('==========================================');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Não foi possível fazer login. Verifique se o backend está rodando.');
    process.exit(1);
  }

  await testDeliveryEndpoints();
  
  console.log('\n✅ Teste concluído!');
}

main().catch(console.error); 