// Script de teste para múltiplos sabores
const axios = require('axios');

const testMultipleFlavors = async () => {
  try {
    console.log('🧪 Testando funcionalidade de múltiplos sabores...');
    
    // Simular dados de um pedido com múltiplos sabores
    const orderData = {
      cliente_id: null, // Será criado automaticamente
      entregador_nome: 'João Silva',
      total: 45.00,
      forma_pagamento: 'dinheiro',
      valor_pago: 50.00,
      troco_calculado: 5.00,
      observacoes: 'Teste de múltiplos sabores',
      tipo_pedido: 'delivery',
      endereco_entrega: 'Rua Teste, 123',
      taxa_entrega: 5.00,
      items: [
        {
          itemType: 'pizza',
          quantity: 1,
          valor_unitario: 40.00,
          tamanho_registrado: 'media',
          useMultipleFlavors: true,
          sabores_registrados: [
            {
              nome: 'Calabresa',
              produto_id: 'uuid-calabresa',
              percentual: 50
            },
            {
              nome: 'Mussarela',
              produto_id: 'uuid-mussarela', 
              percentual: 50
            }
          ]
        }
      ]
    };

    // Dados do cliente para teste
    const customerData = {
      customerName: 'Cliente Teste',
      customerPhone: '(11) 99999-9999',
      customerAddress: 'Rua Teste, 123'
    };

    console.log('📦 Dados do pedido:', JSON.stringify(orderData, null, 2));

    // Fazer requisição para criar o pedido
    const response = await axios.post('http://localhost:3001/api/orders', {
      ...customerData,
      ...orderData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token-teste' // Pode precisar de um token válido
      }
    });

    console.log('✅ Pedido criado com sucesso!');
    console.log('📋 Resposta:', response.data);

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('ℹ️ Erro de autenticação - isso é esperado se não houver token válido');
    }
  }
};

const testDatabaseQuery = async () => {
  try {
    console.log('\n🔍 Testando consulta no banco...');
    
    // Fazer requisição para listar pedidos
    const response = await axios.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': 'Bearer token-teste'
      }
    });

    console.log('✅ Consulta realizada com sucesso!');
    console.log('📋 Primeiros pedidos:', response.data.orders?.slice(0, 2));

  } catch (error) {
    console.error('❌ Erro na consulta:', error.response?.data || error.message);
  }
};

// Executar testes
testMultipleFlavors().then(() => {
  return testDatabaseQuery();
}).then(() => {
  console.log('\n🎉 Testes concluídos!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro geral:', error);
  process.exit(1);
});