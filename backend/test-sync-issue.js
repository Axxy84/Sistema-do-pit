const db = require('./config/database');

async function testSyncIssue() {
  console.log('🔍 Testando sincronização de pedidos entregues com fechamento de caixa\n');

  try {
    // 1. Buscar um pedido de delivery que não esteja entregue
    const pendingOrdersResult = await db.query(`
      SELECT id, numero_pedido, tipo_pedido, status_pedido, total, taxa_entrega, forma_pagamento
      FROM pedidos 
      WHERE tipo_pedido = 'delivery' 
        AND status_pedido NOT IN ('entregue', 'cancelado')
        AND DATE(data_pedido) = CURRENT_DATE
      LIMIT 1
    `);

    if (pendingOrdersResult.rows.length === 0) {
      console.log('❌ Nenhum pedido de delivery pendente encontrado hoje.');
      console.log('💡 Crie um pedido de delivery primeiro e execute este teste novamente.\n');
      return;
    }

    const order = pendingOrdersResult.rows[0];
    console.log('📦 Pedido encontrado:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Número: ${order.numero_pedido}`);
    console.log(`   Status: ${order.status_pedido}`);
    console.log(`   Total: R$ ${order.total}`);
    console.log(`   Taxa Entrega: R$ ${order.taxa_entrega || 0}`);
    console.log(`   Forma Pagamento: ${order.forma_pagamento}\n`);

    // 2. Buscar dados atuais do fechamento ANTES da entrega
    console.log('📊 Dados do fechamento ANTES de marcar como entregue:');
    const beforeResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(SUM(taxa_entrega), 0) as total_taxas_entrega,
        COUNT(CASE WHEN tipo_pedido = 'delivery' THEN 1 END) as pedidos_delivery,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'delivery' THEN total ELSE 0 END), 0) as vendas_delivery,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'delivery' THEN taxa_entrega ELSE 0 END), 0) as taxas_delivery
      FROM pedidos 
      WHERE DATE(data_pedido) = CURRENT_DATE 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `);

    const before = beforeResult.rows[0];
    console.log(`   Total de pedidos entregues: ${before.total_pedidos}`);
    console.log(`   Vendas brutas: R$ ${before.vendas_brutas}`);
    console.log(`   Total taxas entrega: R$ ${before.total_taxas_entrega}`);
    console.log(`   Pedidos delivery entregues: ${before.pedidos_delivery}`);
    console.log(`   Vendas delivery: R$ ${before.vendas_delivery}`);
    console.log(`   Taxas delivery: R$ ${before.taxas_delivery}\n`);

    // 3. Marcar pedido como entregue
    console.log('✅ Marcando pedido como ENTREGUE...');
    await db.query(`
      UPDATE pedidos 
      SET status_pedido = 'entregue', 
          updated_at = NOW()
      WHERE id = $1
    `, [order.id]);

    // 4. Buscar dados atuais do fechamento DEPOIS da entrega
    console.log('\n📊 Dados do fechamento DEPOIS de marcar como entregue:');
    const afterResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(SUM(taxa_entrega), 0) as total_taxas_entrega,
        COUNT(CASE WHEN tipo_pedido = 'delivery' THEN 1 END) as pedidos_delivery,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'delivery' THEN total ELSE 0 END), 0) as vendas_delivery,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'delivery' THEN taxa_entrega ELSE 0 END), 0) as taxas_delivery
      FROM pedidos 
      WHERE DATE(data_pedido) = CURRENT_DATE 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `);

    const after = afterResult.rows[0];
    console.log(`   Total de pedidos entregues: ${after.total_pedidos} (${after.total_pedidos > before.total_pedidos ? '+1' : '0'})`);
    console.log(`   Vendas brutas: R$ ${after.vendas_brutas} (+R$ ${(after.vendas_brutas - before.vendas_brutas).toFixed(2)})`);
    console.log(`   Total taxas entrega: R$ ${after.total_taxas_entrega} (+R$ ${(after.total_taxas_entrega - before.total_taxas_entrega).toFixed(2)})`);
    console.log(`   Pedidos delivery entregues: ${after.pedidos_delivery} (${after.pedidos_delivery > before.pedidos_delivery ? '+1' : '0'})`);
    console.log(`   Vendas delivery: R$ ${after.vendas_delivery} (+R$ ${(after.vendas_delivery - before.vendas_delivery).toFixed(2)})`);
    console.log(`   Taxas delivery: R$ ${after.taxas_delivery} (+R$ ${(after.taxas_delivery - before.taxas_delivery).toFixed(2)})\n`);

    // 5. Verificar se a mudança foi refletida
    if (after.total_pedidos > before.total_pedidos) {
      console.log('✅ SUCESSO: O pedido foi incluído no fechamento de caixa!');
      console.log('   - Vendas aumentaram em R$', (after.vendas_brutas - before.vendas_brutas).toFixed(2));
      if (order.taxa_entrega > 0) {
        console.log('   - Taxa de entrega de R$', order.taxa_entrega, 'foi incluída');
      }
    } else {
      console.log('❌ PROBLEMA: O pedido NÃO foi incluído no fechamento de caixa!');
      console.log('   Possíveis causas:');
      console.log('   - A query do fechamento pode ter filtros adicionais');
      console.log('   - O cache pode estar retornando dados antigos');
      console.log('   - Pode haver um delay na atualização dos dados');
    }

    // 6. Verificar endpoint da API
    console.log('\n🔍 Testando endpoint /api/cash-closing/current:');
    console.log('   Execute no terminal:');
    console.log(`   curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/api/cash-closing/current`);
    console.log('\n   Verifique se os valores correspondem aos mostrados acima.');

    // 7. Restaurar status original do pedido para permitir novos testes
    console.log('\n🔄 Restaurando status original do pedido para permitir novos testes...');
    await db.query(`
      UPDATE pedidos 
      SET status_pedido = $2, 
          updated_at = NOW()
      WHERE id = $1
    `, [order.id, order.status_pedido]);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await db.end();
  }
}

console.log('='.repeat(80));
console.log('TESTE DE SINCRONIZAÇÃO: PEDIDO ENTREGUE → FECHAMENTO DE CAIXA');
console.log('='.repeat(80));

testSyncIssue();