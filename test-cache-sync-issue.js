#!/usr/bin/env node

/**
 * Script para testar e diagnosticar o problema de sincronização 
 * entre pedidos delivery marcados como "entregue" e o fechamento de caixa
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5NDk3OTMsImV4cCI6MTc1MDAzNjE5M30.zA_1wTxV9013okNcWpC7orGgcZE7DTRfxEh0koCqClc';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testCacheSyncIssue() {
  console.log('🔍 Testando sincronização entre pedidos delivery e fechamento de caixa\n');

  try {
    // 1. Buscar dados atuais do fechamento de caixa
    console.log('1️⃣ Buscando dados atuais do fechamento de caixa...');
    const cashClosingBefore = await axios.get(`${API_URL}/cash-closing/current`, { headers });
    console.log('✅ Dados antes da atualização:');
    console.log(`   - Total pedidos: ${cashClosingBefore.data.cash_closing.total_pedidos}`);
    console.log(`   - Vendas brutas: R$ ${cashClosingBefore.data.cash_closing.vendas_brutas}`);
    console.log(`   - Detalhes por tipo:`, cashClosingBefore.data.cash_closing.details_by_type);
    console.log('');

    // 2. Buscar um pedido delivery pendente
    console.log('2️⃣ Buscando pedidos delivery pendentes...');
    const ordersResponse = await axios.get(`${API_URL}/orders`, {
      headers,
      params: {
        tipo_pedido: 'delivery',
        status: ['pendente', 'preparando', 'pronto', 'saiu_entrega']
      }
    });

    const deliveryOrders = ordersResponse.data.orders.filter(o => 
      o.tipo_pedido === 'delivery' && 
      !['entregue', 'cancelado'].includes(o.status_pedido)
    );

    if (deliveryOrders.length === 0) {
      console.log('⚠️  Nenhum pedido delivery pendente encontrado para teste');
      console.log('   Criando um pedido de teste...');
      
      // Criar pedido de teste
      const testOrder = await axios.post(`${API_URL}/orders`, {
        cliente_id: null,
        total: 50.00,
        forma_pagamento: 'dinheiro',
        tipo_pedido: 'delivery',
        endereco_entrega: 'Rua Teste, 123',
        items: [{
          sabor_registrado: 'Pizza Teste',
          quantidade: 1,
          valor_unitario: 50.00
        }]
      }, { headers });

      console.log(`✅ Pedido de teste criado: ${testOrder.data.order.id}`);
      deliveryOrders.push(testOrder.data.order);
    }

    const testOrderId = deliveryOrders[0].id;
    const testOrderValue = deliveryOrders[0].total;
    console.log(`✅ Usando pedido: ${testOrderId} - Valor: R$ ${testOrderValue}`);
    console.log('');

    // 3. Marcar pedido como entregue
    console.log('3️⃣ Marcando pedido como ENTREGUE...');
    const updateResponse = await axios.patch(
      `${API_URL}/orders/${testOrderId}/status`,
      { status_pedido: 'entregue' },
      { headers }
    );
    console.log('✅ Status atualizado para:', updateResponse.data.order.status_pedido);
    console.log('');

    // 4. Aguardar um pouco para o cache ser invalidado
    console.log('4️⃣ Aguardando 2 segundos para processamento...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Buscar dados atualizados do fechamento de caixa
    console.log('5️⃣ Buscando dados ATUALIZADOS do fechamento de caixa...');
    const cashClosingAfter = await axios.get(`${API_URL}/cash-closing/current`, { headers });
    console.log('✅ Dados depois da atualização:');
    console.log(`   - Total pedidos: ${cashClosingAfter.data.cash_closing.total_pedidos}`);
    console.log(`   - Vendas brutas: R$ ${cashClosingAfter.data.cash_closing.vendas_brutas}`);
    console.log(`   - Detalhes por tipo:`, cashClosingAfter.data.cash_closing.details_by_type);
    console.log('');

    // 6. Comparar resultados
    console.log('6️⃣ Análise da sincronização:');
    const pedidosAntes = cashClosingBefore.data.cash_closing.total_pedidos;
    const pedidosDepois = cashClosingAfter.data.cash_closing.total_pedidos;
    const vendasAntes = cashClosingBefore.data.cash_closing.vendas_brutas;
    const vendasDepois = cashClosingAfter.data.cash_closing.vendas_brutas;

    if (pedidosDepois > pedidosAntes) {
      console.log('✅ SUCESSO: O fechamento de caixa foi atualizado!');
      console.log(`   - Pedidos aumentaram de ${pedidosAntes} para ${pedidosDepois}`);
      console.log(`   - Vendas aumentaram de R$ ${vendasAntes} para R$ ${vendasDepois}`);
    } else {
      console.log('❌ PROBLEMA: O fechamento de caixa NÃO foi atualizado!');
      console.log(`   - Pedidos continuam em ${pedidosAntes}`);
      console.log(`   - Vendas continuam em R$ ${vendasAntes}`);
      console.log('\n🔍 Possíveis causas:');
      console.log('   1. Cache não está sendo invalidado corretamente');
      console.log('   2. Query SQL não está incluindo o status "entregue"');
      console.log('   3. Delay maior necessário para sincronização');
    }

    // 7. Verificar cache diretamente
    console.log('\n7️⃣ Verificando status do cache...');
    try {
      const cacheStatus = await axios.get(`${API_URL}/cache-admin/stats`, { headers });
      console.log('📊 Estatísticas do cache:', cacheStatus.data);
    } catch (error) {
      console.log('⚠️  Não foi possível acessar estatísticas do cache');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Executar o teste
testCacheSyncIssue();