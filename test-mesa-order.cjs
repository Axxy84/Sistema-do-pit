const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testMesaOrder() {
  try {
    // Token de teste válido
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5MTM0NjAsImV4cCI6MTc0OTk5OTg2MH0.xnsbT9AuFZgmkXWb2RSKJt13QPolr_YzO3rMj8Rge0c';
    
    const orderData = {
      cliente_id: null,
      entregador_nome: null,
      status_pedido: 'pendente',
      total: 45.00,
      forma_pagamento: 'dinheiro',
      observacoes: '',
      data_pedido: new Date().toISOString(),
      valor_pago: null,
      troco_calculado: null,
      cupom_id: null,
      desconto_aplicado: 0,
      pontos_ganhos: 0,
      pontos_resgatados: 0,
      created_at: new Date().toISOString(),
      tipo_pedido: 'mesa',
      numero_mesa: 5,
      endereco_entrega: null,
      taxa_entrega: 0,
      multiplos_pagamentos: false,
      pagamentos: []
    };
    
    const itemsData = [{
      produto_id_ref: null,
      quantidade: 1,
      valor_unitario: 45.00,
      itemType: 'pizza',
      tamanho_registrado: 'familia',
      sabor_registrado: 'Calabresa'
    }];
    
    console.log('📋 Testando criação de pedido de mesa...');
    console.log('Dados do pedido:', JSON.stringify(orderData, null, 2));
    console.log('Itens:', JSON.stringify(itemsData, null, 2));
    
    // Criar o pedido via API
    const response = await axios.post('http://localhost:3001/api/orders', 
      { ...orderData, items: itemsData },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Pedido criado com sucesso!');
    console.log('ID do pedido:', response.data.order.id);
    console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao criar pedido:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testMesaOrder();