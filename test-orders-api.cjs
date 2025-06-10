require('dotenv').config();
const axios = require('axios');

async function testOrdersAPI() {
  try {
    console.log('🧪 Testando API de Pedidos...\n');
    
    // 1. Fazer login para obter token
    console.log('🔐 1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/signin', {
      email: 'admin@pizzaria.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Testar API de pedidos com token
    console.log('\n📋 2. Testando API de pedidos...');
    const ordersResponse = await axios.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log('✅ API de pedidos funcionando!');
    console.log(`📊 Total de pedidos: ${ordersResponse.data.length || 0}`);
    
    if (ordersResponse.data.length > 0) {
      const pedido = ordersResponse.data[0];
      console.log('📋 Exemplo de pedido:');
      console.log(`   - ID: ${pedido.id}`);
      console.log(`   - Status: ${pedido.status_pedido || pedido.status}`);
      console.log(`   - Tipo: ${pedido.tipo_pedido || 'N/A'}`);
      console.log(`   - Total: R$ ${pedido.total}`);
    }
    
    // 3. Testar outras APIs importantes
    console.log('\n🍕 3. Testando API de produtos...');
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log(`✅ API de produtos: ${productsResponse.data.length || 0} produtos encontrados`);
    
    console.log('\n🚚 4. Testando API de entregadores...');
    const deliverersResponse = await axios.get('http://localhost:3001/api/deliverers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log(`✅ API de entregadores: ${deliverersResponse.data.length || 0} entregadores encontrados`);
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Frontend deveria funcionar agora.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testOrdersAPI(); 