const db = require('./config/database');
const axios = require('axios');

// Token JWT válido (substitua pelo seu token)
const JWT_TOKEN = 'SEU_TOKEN_AQUI';
const API_BASE = 'http://localhost:3001/api';

async function testRealtimeSync() {
  console.log('🔄 Testando sincronização em tempo real entre frontend e backend\n');

  try {
    // 1. Primeiro, buscar dados atuais do fechamento via API
    console.log('📊 Buscando dados atuais do fechamento de caixa via API...');
    
    try {
      const cashClosingResponse = await axios.get(`${API_BASE}/cash-closing/current`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      });
      
      const currentData = cashClosingResponse.data.cash_closing;
      console.log('✅ Dados atuais do fechamento:');
      console.log(`   Total pedidos: ${currentData.total_pedidos}`);
      console.log(`   Vendas brutas: R$ ${currentData.vendas_brutas}`);
      console.log(`   Taxa entrega total: R$ ${currentData.details_by_type?.reduce((sum, d) => sum + (d.total_taxas_entrega || 0), 0) || 0}`);
      
      if (currentData.details_by_type) {
        console.log('\n📈 Por tipo de pedido:');
        currentData.details_by_type.forEach(detail => {
          console.log(`   ${detail.tipo_pedido}: ${detail.total_pedidos} pedidos - R$ ${detail.vendas_brutas}`);
          if (detail.total_taxas_entrega > 0) {
            console.log(`     Taxa entrega: R$ ${detail.total_taxas_entrega}`);
          }
        });
      }
    } catch (apiError) {
      console.log('⚠️  Erro ao buscar via API. Certifique-se de:');
      console.log('   1. Substituir JWT_TOKEN pelo token válido');
      console.log('   2. O servidor backend está rodando na porta 3001');
      console.log('   3. Para gerar um token válido, execute: node generate-test-token.js');
      console.log(`\n   Erro: ${apiError.message}\n`);
    }

    // 2. Buscar pedidos pendentes direto do banco
    console.log('\n🔍 Buscando pedidos pendentes para teste...');
    const pendingOrdersResult = await db.query(`
      SELECT 
        id, numero_pedido, tipo_pedido, status_pedido, total, taxa_entrega,
        forma_pagamento, numero_mesa
      FROM pedidos 
      WHERE status_pedido NOT IN ('entregue', 'fechada', 'cancelado')
        AND DATE(data_pedido) = CURRENT_DATE
      ORDER BY tipo_pedido, created_at DESC
      LIMIT 5
    `);

    if (pendingOrdersResult.rows.length === 0) {
      console.log('❌ Nenhum pedido pendente encontrado.');
      console.log('💡 Crie alguns pedidos primeiro para testar a sincronização.\n');
      return;
    }

    console.log('📦 Pedidos pendentes encontrados:');
    pendingOrdersResult.rows.forEach((order, index) => {
      console.log(`\n${index + 1}. ${order.tipo_pedido === 'mesa' ? `Mesa #${order.numero_mesa}` : 'Delivery'}`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Status: ${order.status_pedido}`);
      console.log(`   Total: R$ ${order.total}`);
      if (order.tipo_pedido === 'delivery') {
        console.log(`   Taxa entrega: R$ ${order.taxa_entrega || 0}`);
      }
    });

    console.log('\n💡 COMO TESTAR A SINCRONIZAÇÃO:\n');
    
    console.log('1. TESTE DE PEDIDO DELIVERY:');
    console.log('   a) Abra o sistema em duas abas: Pedidos e Fechamento de Caixa');
    console.log('   b) Na tela de Pedidos, clique em "Entregue" em um pedido delivery');
    console.log('   c) Observe o Fechamento de Caixa - deve atualizar em ~1 segundo');
    console.log('   d) Verifique se o valor total e taxa de entrega são incluídos\n');
    
    console.log('2. TESTE DE FECHAMENTO DE MESA:');
    console.log('   a) Abra o sistema em duas abas: Mesas e Fechamento de Caixa');
    console.log('   b) Na tela de Mesas, clique em "Fechar Conta" em uma mesa');
    console.log('   c) Selecione a forma de pagamento');
    console.log('   d) Observe o Fechamento de Caixa - deve atualizar automaticamente\n');
    
    console.log('3. VERIFICAR LOGS NO CONSOLE DO NAVEGADOR:');
    console.log('   - Abra o DevTools (F12) e vá para a aba Console');
    console.log('   - Você deve ver logs como:');
    console.log('     "💰 [CashClosing] Evento orderDelivered recebido"');
    console.log('     "💰 [SeparateClosing] Evento de mudança de status recebido"');
    console.log('     "📊 [Dashboard] Evento orderDelivered recebido"\n');
    
    console.log('4. PROBLEMAS COMUNS:');
    console.log('   ❌ Se não atualizar:');
    console.log('      - Verifique se há erros no console do navegador');
    console.log('      - Confirme que o backend está rodando');
    console.log('      - Verifique a aba Network para ver se as requisições estão sendo feitas');
    console.log('   ❌ Se a taxa de entrega não aparecer:');
    console.log('      - Confirme que o pedido tem taxa_entrega > 0');
    console.log('      - Verifique se o tipo_pedido é "delivery"');
    
    // 3. Mostrar query SQL para debug manual
    console.log('\n🔧 QUERIES SQL PARA DEBUG MANUAL:\n');
    console.log('-- Ver pedidos entregues hoje com taxas:');
    console.log(`SELECT tipo_pedido, status_pedido, COUNT(*) as qtd, 
       SUM(total) as vendas, SUM(taxa_entrega) as taxas
FROM pedidos 
WHERE DATE(data_pedido) = CURRENT_DATE 
  AND status_pedido IN ('entregue', 'retirado', 'fechada')
GROUP BY tipo_pedido, status_pedido;`);
    
    console.log('\n-- Ver detalhes de delivery com taxa:');
    console.log(`SELECT numero_pedido, total, taxa_entrega, 
       (total + COALESCE(taxa_entrega, 0)) as total_com_taxa
FROM pedidos 
WHERE tipo_pedido = 'delivery' 
  AND DATE(data_pedido) = CURRENT_DATE
  AND status_pedido = 'entregue';`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await db.end();
  }
}

console.log('='.repeat(80));
console.log('TESTE DE SINCRONIZAÇÃO EM TEMPO REAL');
console.log('='.repeat(80));

testRealtimeSync();