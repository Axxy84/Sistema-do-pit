const axios = require('axios');

async function testRetiradoStatus() {
  try {
    // Token de teste hardcoded (válido por 7 dias)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNTM5NGVjMS00OGU4LTRhNDEtYTNmNy1hOWQwMTBjZGJmYjkiLCJpYXQiOjE3NDk5MjAxNTQsImV4cCI6MTc1MDUyNDk1NH0.X2-c7xMuSJKDaGqCQ2VFJzNJKuKhFQvYY1XD7L8LQKA';
    
    console.log('🔍 Testando endpoint PATCH /orders/:id/status com status "retirado"...\n');
    
    // Primeiro, buscar um pedido existente
    const ordersResponse = await axios.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
      const orderId = ordersResponse.data.orders[0].id;
      console.log(`📦 Usando pedido ID: ${orderId}`);
      
      // Tentar atualizar o status para "retirado"
      try {
        const updateResponse = await axios.patch(
          `http://localhost:3001/api/orders/${orderId}/status`,
          { status_pedido: 'retirado' },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Status atualizado com sucesso!');
        console.log('📊 Resposta:', updateResponse.data);
      } catch (updateError) {
        console.error('❌ Erro ao atualizar status:');
        console.error('Status:', updateError.response?.status);
        console.error('Mensagem:', updateError.response?.data);
        
        // Se erro 400, verificar valores aceitos
        if (updateError.response?.status === 400) {
          console.log('\n🔍 Verificando implementação do endpoint...');
          // Tentar com outro status para confirmar
          try {
            await axios.patch(
              `http://localhost:3001/api/orders/${orderId}/status`,
              { status_pedido: 'entregue' },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log('✅ Status "entregue" funcionou - problema específico com "retirado"');
          } catch (e) {
            console.log('❌ Outros status também falham - problema geral no endpoint');
          }
        }
      }
    } else {
      console.log('⚠️ Nenhum pedido encontrado para teste');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Executar teste
testRetiradoStatus();