#!/usr/bin/env node

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5NDk3OTMsImV4cCI6MTc1MDAzNjE5M30.zA_1wTxV9013okNcWpC7orGgcZE7DTRfxEh0koCqClc';

async function testCashAPI() {
  console.log('🔍 Testando API de fechamento de caixa após correção\n');

  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Buscar dados atuais
    console.log('1️⃣ Buscando dados do fechamento de caixa via API...');
    const response = await axios.get(`${API_URL}/cash-closing/current`, { headers });
    
    const data = response.data.cash_closing;
    console.log('\n✅ Resposta da API:');
    console.log(`   Total de pedidos: ${data.total_pedidos}`);
    console.log(`   Vendas brutas: R$ ${data.vendas_brutas}`);
    console.log(`   Vendas líquidas: R$ ${data.vendas_liquidas}`);
    console.log(`   Saldo final: R$ ${data.saldo_final}`);
    
    if (data.details_by_type && data.details_by_type.length > 0) {
      console.log('\n📊 Detalhes por tipo:');
      data.details_by_type.forEach(detail => {
        console.log(`   ${detail.tipo_pedido}: ${detail.total_pedidos} pedidos, R$ ${detail.vendas_brutas}`);
      });
    }

    // 2. Verificar se os dados estão corretos
    console.log('\n2️⃣ Análise dos resultados:');
    if (data.total_pedidos > 0) {
      console.log('✅ SUCESSO! O fechamento de caixa agora está capturando os pedidos corretamente!');
      console.log(`   - ${data.total_pedidos} pedidos encontrados`);
      console.log(`   - Total de vendas: R$ ${data.vendas_brutas}`);
    } else {
      console.log('⚠️  Nenhum pedido encontrado. Verifique se há pedidos com status entregue/fechada/retirado hoje.');
    }

    // 3. Testar sincronização em tempo real
    console.log('\n3️⃣ Testando sincronização em tempo real...');
    console.log('   Criando um novo pedido de teste...');
    
    const testOrder = await axios.post(`${API_URL}/orders`, {
      cliente_id: null,
      total: 35.00,
      forma_pagamento: 'pix',
      tipo_pedido: 'delivery',
      endereco_entrega: 'Rua Teste Sync, 456',
      items: [{
        sabor_registrado: 'Pizza Sync Test',
        quantidade: 1,
        valor_unitario: 35.00
      }]
    }, { headers });

    const orderId = testOrder.data.order.id;
    console.log(`   ✅ Pedido criado: ${orderId}`);

    // Marcar como entregue
    console.log('   Marcando pedido como entregue...');
    await axios.patch(`${API_URL}/orders/${orderId}/status`, 
      { status_pedido: 'entregue' }, 
      { headers }
    );

    // Aguardar um pouco
    console.log('   Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Buscar dados atualizados
    console.log('   Buscando dados atualizados...');
    const updatedResponse = await axios.get(`${API_URL}/cash-closing/current`, { headers });
    const updatedData = updatedResponse.data.cash_closing;

    console.log('\n✅ Dados após novo pedido:');
    console.log(`   Total de pedidos: ${data.total_pedidos} → ${updatedData.total_pedidos}`);
    console.log(`   Vendas brutas: R$ ${data.vendas_brutas} → R$ ${updatedData.vendas_brutas}`);

    if (updatedData.total_pedidos > data.total_pedidos) {
      console.log('\n🎉 PERFEITO! A sincronização está funcionando corretamente!');
      console.log('   O fechamento de caixa foi atualizado em tempo real quando o pedido foi entregue.');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testCashAPI();