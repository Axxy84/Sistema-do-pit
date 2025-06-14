const axios = require('axios');

async function createTestOrder() {
  try {
    console.log('🍕 Criando pedido de teste...\n');

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5MTA4ODEsImV4cCI6MTc0OTk5NzI4MX0.1I3Re_ASeZcKBkqmVhTWRhcBiKQ0kRPKVAj17-FFQME';

    // Criar um pedido de delivery
    const deliveryOrder = {
      total: 45.90,
      forma_pagamento: 'dinheiro',
      valor_pago: 50.00,
      troco_calculado: 4.10,
      observacoes: 'Pedido de teste - Delivery',
      tipo_pedido: 'delivery',
      endereco_entrega: 'Rua Teste, 123 - Bairro Centro',
      taxa_entrega: 5.00,
      entregador_nome: 'João Silva',
      items: [
        {
          itemType: 'pizza',
          sabor_registrado: 'Margherita',
          tamanho_registrado: 'Grande',
          quantidade: 1,
          valor_unitario: 40.90
        }
      ]
    };

    console.log('1️⃣ Criando pedido de delivery...');
    const deliveryResponse = await axios.post('http://localhost:3001/api/orders', deliveryOrder, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Pedido de delivery criado!');
    console.log(`ID: ${deliveryResponse.data.order.id}`);
    console.log(`Total: R$ ${deliveryResponse.data.order.total}`);

    // Criar um pedido de mesa
    const mesaOrder = {
      total: 35.50,
      forma_pagamento: 'cartao',
      observacoes: 'Pedido de teste - Mesa',
      tipo_pedido: 'mesa',
      numero_mesa: 5,
      items: [
        {
          itemType: 'pizza',
          sabor_registrado: 'Calabresa',
          tamanho_registrado: 'Média',
          quantidade: 1,
          valor_unitario: 35.50
        }
      ]
    };

    console.log('\n2️⃣ Criando pedido de mesa...');
    const mesaResponse = await axios.post('http://localhost:3001/api/orders', mesaOrder, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Pedido de mesa criado!');
    console.log(`ID: ${mesaResponse.data.order.id}`);
    console.log(`Mesa: ${mesaResponse.data.order.numero_mesa}`);

    // Testar listagem novamente
    console.log('\n3️⃣ Verificando lista de pedidos...');
    const listResponse = await axios.get('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Total de pedidos agora: ${listResponse.data.orders.length}`);
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar pedido:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Mensagem:`, error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

createTestOrder();