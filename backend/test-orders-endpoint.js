const axios = require('axios');

async function testOrdersEndpoint() {
  try {
    console.log('🔍 Testando endpoint /api/orders...\n');

    // Primeiro, fazer login para obter token
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/signin', {
      email: 'admin@pizzaria.com',
      password: 'admin123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login bem-sucedido! Token obtido.\n');

    // Testar GET /api/orders
    console.log('2️⃣ Testando GET /api/orders...');
    const ordersResponse = await axios.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Endpoint funcionando!');
    console.log(`📊 Total de pedidos: ${ordersResponse.data.orders.length}`);
    
    if (ordersResponse.data.orders.length > 0) {
      console.log('\n📋 Primeiro pedido:');
      console.log(JSON.stringify(ordersResponse.data.orders[0], null, 2));
    } else {
      console.log('\nℹ️ Nenhum pedido encontrado no banco de dados.');
    }

    // Testar com filtros
    console.log('\n3️⃣ Testando com filtros...');
    const filteredResponse = await axios.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        status: 'pendente'
      }
    });

    console.log(`✅ Filtro por status funcionando! Pedidos pendentes: ${filteredResponse.data.orders.length}`);

    console.log('\n🎉 Todos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Mensagem: ${error.response.data.error || error.response.data.message}`);
      console.error(`Dados completos:`, error.response.data);
    } else if (error.request) {
      console.error('Sem resposta do servidor. Verifique se o backend está rodando na porta 3001.');
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testOrdersEndpoint();