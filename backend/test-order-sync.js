// 5️⃣ Teste automatizado mínimo - Padrão 80/20

const axios = require('axios');
const db = require('./config/database');

// Configuração
const API_BASE = 'http://localhost:3001/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5NDU2NjEsImV4cCI6MTc1MDAzMjA2MX0.EGjYWlmK0YtTOb8wT73sI73oziucH5w1f2DZIT4itZc';

async function testOrderSync() {
  console.log('🧪 Teste de Sincronização Pedido → Caixa\n');
  
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Contar transações antes
    const beforeCount = await db.query('SELECT COUNT(*) FROM transacoes WHERE tipo_transacao = $1', ['entrada']);
    console.log(`📊 Transações antes: ${beforeCount.rows[0].count}`);
    
    // 2. Criar pedido de teste
    console.log('\n🆕 Criando pedido de teste...');
    const orderData = {
      tipo_pedido: 'delivery', // Binário: 1
      cliente_id: null,
      endereco_entrega: 'Rua Teste Sync, 123',
      itens: [{
        produto_id: (await db.query('SELECT id FROM produtos LIMIT 1')).rows[0].id,
        quantidade: 1,
        preco_unitario: 50.00,
        observacoes: 'Teste sync'
      }],
      forma_pagamento: 'dinheiro',
      troco: 100
    };
    
    const createResponse = await axios.post(`${API_BASE}/orders`, orderData, { headers });
    const orderId = createResponse.data.order.id;
    console.log(`✅ Pedido criado: ${orderId}`);
    
    // 3. Marcar como entregue
    console.log('\n📦 Marcando como entregue...');
    const statusResponse = await axios.patch(
      `${API_BASE}/orders/${orderId}/status`,
      { status_pedido: 'entregue' },
      { headers }
    );
    
    console.log(`✅ Status atualizado: ${statusResponse.data.status}`);
    
    // 4. Verificar se foi para o caixa
    console.log('\n🔍 Verificando sincronização...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
    
    const afterCount = await db.query('SELECT COUNT(*) FROM transacoes WHERE tipo_transacao = $1', ['entrada']);
    const newTransactions = afterCount.rows[0].count - beforeCount.rows[0].count;
    
    console.log(`📊 Transações depois: ${afterCount.rows[0].count}`);
    console.log(`➕ Novas transações: ${newTransactions}`);
    
    // 5. Verificar detalhes da transação
    const transaction = await db.query(
      'SELECT * FROM transacoes WHERE pedido_id = $1',
      [orderId]
    );
    
    if (transaction.rows.length > 0) {
      console.log('\n✅ TESTE PASSOU! Transação encontrada:');
      console.log(JSON.stringify({
        pedido_id: transaction.rows[0].pedido_id,
        valor: transaction.rows[0].valor,
        forma_pagamento: transaction.rows[0].forma_pagamento,
        descricao: transaction.rows[0].descricao
      }, null, 2));
    } else {
      console.log('\n❌ TESTE FALHOU! Nenhuma transação encontrada para o pedido.');
    }
    
    // 6. Verificar endpoint de sincronização
    console.log('\n🔄 Testando endpoint de sync-status...');
    const syncStatus = await axios.get(
      `${API_BASE}/orders/${orderId}/sync-status`,
      { headers }
    );
    
    console.log('Status de sincronização:', JSON.stringify({
      status_bin: syncStatus.data.status_bin,
      tipo_bin: syncStatus.data.tipo_bin,
      no_caixa: syncStatus.data.no_caixa
    }, null, 2));
    
    // Assertions
    console.assert(statusResponse.status === 200, 'PATCH /orders/:id/status deve retornar 200');
    console.assert(newTransactions >= 1, 'Deve ter criado pelo menos 1 transação');
    console.assert(syncStatus.data.no_caixa === true, 'Pedido deve estar no caixa');
    
    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);
  } finally {
    await db.end();
  }
}

// Executar teste
testOrderSync();