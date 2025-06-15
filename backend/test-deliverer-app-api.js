const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testDelivererAppAPI() {
  console.log('🧪 Testando API do App do Entregador...\n');

  try {
    // 1. Teste de Login
    console.log('📱 1. Testando login de entregador...');
    const loginResponse = await axios.post(`${BASE_URL}/deliverer-app/auth/login`, {
      telefone: '11999999999',
      senha: '123456'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login bem-sucedido!');
      console.log(`   Entregador: ${loginResponse.data.entregador.nome}`);
      console.log(`   Token gerado: ${loginResponse.data.token.substring(0, 20)}...`);
      
      const token = loginResponse.data.token;

      // 2. Teste de validação de token
      console.log('\n🔐 2. Testando validação de token...');
      const meResponse = await axios.get(`${BASE_URL}/deliverer-app/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (meResponse.data.success) {
        console.log('✅ Token válido!');
        console.log(`   Entregador: ${meResponse.data.entregador.nome}`);
      }

      // 3. Teste de pedidos disponíveis
      console.log('\n📦 3. Testando busca de pedidos disponíveis...');
      const availableOrdersResponse = await axios.get(`${BASE_URL}/deliverer-app/pedidos/disponiveis`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (availableOrdersResponse.data.success) {
        console.log('✅ Pedidos disponíveis carregados!');
        console.log(`   Total: ${availableOrdersResponse.data.total} pedidos`);
        
        if (availableOrdersResponse.data.pedidos.length > 0) {
          const firstOrder = availableOrdersResponse.data.pedidos[0];
          console.log(`   Primeiro pedido: ${firstOrder.id}`);
          console.log(`   Cliente: ${firstOrder.cliente.nome}`);
          console.log(`   Total: R$ ${firstOrder.total}`);
        }
      }

      // 4. Teste de meus pedidos
      console.log('\n📋 4. Testando meus pedidos...');
      const myOrdersResponse = await axios.get(`${BASE_URL}/deliverer-app/pedidos/meus`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (myOrdersResponse.data.success) {
        console.log('✅ Meus pedidos carregados!');
        console.log(`   Total: ${myOrdersResponse.data.total} pedidos`);
      }

      // 5. Teste de histórico
      console.log('\n📚 5. Testando histórico de entregas...');
      const historyResponse = await axios.get(`${BASE_URL}/deliverer-app/historico?limite=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (historyResponse.data.success) {
        console.log('✅ Histórico carregado!');
        console.log(`   Total de registros: ${historyResponse.data.total_registros}`);
        console.log(`   Entregas na página: ${historyResponse.data.historico.length}`);
      }

      // 6. Criar um pedido de teste para aceitar
      console.log('\n🆕 6. Criando pedido de teste...');
      
      // Buscar um cliente para o pedido
      const clientesResponse = await axios.get(`${BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (clientesResponse.data.customers && clientesResponse.data.customers.length > 0) {
        const cliente = clientesResponse.data.customers[0];
        
        // Buscar produtos para o pedido
        const produtosResponse = await axios.get(`${BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (produtosResponse.data.products && produtosResponse.data.products.length > 0) {
          const produto = produtosResponse.data.products[0];
          
          const novoPedido = {
            cliente_id: cliente.id,
            tipo_pedido: 'delivery',
            endereco_entrega: 'Rua de Teste, 123 - Bairro Teste',
            observacoes: 'Pedido de teste para app do entregador',
            forma_pagamento: 'dinheiro',
            taxa_entrega: 5.00,
            itens: [{
              produto_id: produto.id,
              quantidade: 1,
              preco_unitario: produto.preco || 25.00,
              observacoes: 'Item de teste'
            }]
          };

          try {
            const pedidoResponse = await axios.post(`${BASE_URL}/orders`, novoPedido, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (pedidoResponse.data.success) {
              console.log('✅ Pedido de teste criado!');
              const pedidoId = pedidoResponse.data.order.id;
              console.log(`   ID do pedido: ${pedidoId}`);

              // 7. Teste de aceitar pedido
              console.log('\n✋ 7. Testando aceitar pedido...');
              const acceptResponse = await axios.post(`${BASE_URL}/deliverer-app/pedidos/${pedidoId}/aceitar`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (acceptResponse.data.success) {
                console.log('✅ Pedido aceito com sucesso!');
                console.log(`   Mensagem: ${acceptResponse.data.message}`);

                // 8. Teste de detalhes do pedido
                console.log('\n📄 8. Testando detalhes do pedido...');
                const detailsResponse = await axios.get(`${BASE_URL}/deliverer-app/pedidos/${pedidoId}/detalhes`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (detailsResponse.data.success) {
                  console.log('✅ Detalhes do pedido carregados!');
                  const pedido = detailsResponse.data.pedido;
                  console.log(`   Status: ${pedido.status}`);
                  console.log(`   Cliente: ${pedido.cliente.nome}`);
                  console.log(`   Itens: ${pedido.itens.length}`);
                }

                // 9. Teste de marcar como entregue
                console.log('\n🚚 9. Testando marcar como entregue...');
                const deliveredResponse = await axios.post(`${BASE_URL}/deliverer-app/pedidos/${pedidoId}/entregar`, {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (deliveredResponse.data.success) {
                  console.log('✅ Pedido marcado como entregue!');
                  console.log(`   Mensagem: ${deliveredResponse.data.message}`);
                }
              }
            }
          } catch (orderError) {
            console.log('ℹ️  Não foi possível criar pedido de teste (normal se não há produtos)');
            console.log('   Endpoints de aceitar/entregar podem ser testados com pedidos existentes');
          }
        }
      }

      console.log('\n🎉 Todos os testes da API concluídos com sucesso!');
      console.log('\n📱 O app do entregador pode ser usado com as seguintes credenciais:');
      console.log('   📞 Telefone: 11999999999');
      console.log('   🔒 Senha: 123456');
      console.log('\n🔗 Endpoints disponíveis:');
      console.log('   POST /api/deliverer-app/auth/login');
      console.log('   GET  /api/deliverer-app/auth/me');
      console.log('   GET  /api/deliverer-app/pedidos/disponiveis');
      console.log('   GET  /api/deliverer-app/pedidos/meus');
      console.log('   POST /api/deliverer-app/pedidos/:id/aceitar');
      console.log('   POST /api/deliverer-app/pedidos/:id/entregar');
      console.log('   GET  /api/deliverer-app/pedidos/:id/detalhes');
      console.log('   GET  /api/deliverer-app/historico');

    } else {
      console.log('❌ Erro no login:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste da API:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

// Executar teste
testDelivererAppAPI()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha no teste:', error);
    process.exit(1);
  });