const db = require('./config/database');

async function testMesaFechamento() {
  try {
    console.log('🔍 Testando fechamento de mesa e propagação para fechamento de caixa...\n');

    // 1. Buscar mesas com status 'fechada'
    const mesasFechadasResult = await db.query(`
      SELECT 
        id,
        numero_mesa,
        status_pedido,
        total,
        forma_pagamento,
        data_pedido,
        created_at,
        updated_at
      FROM pedidos
      WHERE tipo_pedido = 'mesa'
        AND status_pedido = 'fechada'
      ORDER BY updated_at DESC
      LIMIT 10
    `);

    console.log(`📋 Mesas com status 'fechada': ${mesasFechadasResult.rows.length}`);
    if (mesasFechadasResult.rows.length > 0) {
      console.log('\nDetalhes das mesas fechadas:');
      mesasFechadasResult.rows.forEach(mesa => {
        console.log(`  Mesa #${mesa.numero_mesa}: R$ ${mesa.total} - ${mesa.forma_pagamento}`);
        console.log(`    ID: ${mesa.id}`);
        console.log(`    Data pedido: ${mesa.data_pedido || 'NULL'}`);
        console.log(`    Created at: ${mesa.created_at}`);
        console.log(`    Updated at: ${mesa.updated_at}`);
        console.log('    ---');
      });
    }

    // 2. Verificar consulta do fechamento de caixa para hoje
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🗓️ Verificando dados para hoje: ${today}`);

    // Consulta do cash-closing/current (com status 'fechada')
    const cashClosingQueryResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(SUM(desconto_aplicado), 0) as descontos_totais,
        COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
        COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
        COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
      FROM pedidos 
      WHERE DATE(data_pedido) = $1 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `, [today]);

    console.log('\n📊 Resultado da query do fechamento de caixa (inclui "fechada"):');
    console.log(`  Total pedidos: ${cashClosingQueryResult.rows[0].total_pedidos}`);
    console.log(`  Vendas brutas: R$ ${cashClosingQueryResult.rows[0].vendas_brutas}`);

    // 3. Verificar detalhes por tipo (mesa)
    const mesaDetailsResult = await db.query(`
      SELECT 
        tipo_pedido,
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(AVG(total), 0) as ticket_medio,
        COALESCE(SUM(desconto_aplicado), 0) as descontos_totais,
        COALESCE(SUM(taxa_entrega), 0) as total_taxas_entrega,
        COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
        COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
        COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
      FROM pedidos 
      WHERE DATE(data_pedido) = $1 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
        AND tipo_pedido = 'mesa'
      GROUP BY tipo_pedido
    `, [today]);

    if (mesaDetailsResult.rows.length > 0) {
      console.log('\n🍽️ Detalhes específicos de MESA:');
      const mesa = mesaDetailsResult.rows[0];
      console.log(`  Total pedidos mesa: ${mesa.total_pedidos}`);
      console.log(`  Vendas mesa: R$ ${mesa.vendas_brutas}`);
      console.log(`  Ticket médio: R$ ${mesa.ticket_medio}`);
      console.log(`  Formas de pagamento:`);
      console.log(`    - Dinheiro: R$ ${mesa.vendas_dinheiro} (${mesa.pedidos_dinheiro} pedidos)`);
      console.log(`    - Cartão: R$ ${mesa.vendas_cartao} (${mesa.pedidos_cartao} pedidos)`);
      console.log(`    - PIX: R$ ${mesa.vendas_pix} (${mesa.pedidos_pix} pedidos)`);
    }

    // 4. Verificar problema com data_pedido
    console.log('\n🐛 Verificando possível problema com data_pedido:');
    
    const mesasSemDataPedidoResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN data_pedido IS NULL THEN 1 END) as sem_data_pedido,
        COUNT(CASE WHEN data_pedido IS NOT NULL THEN 1 END) as com_data_pedido
      FROM pedidos
      WHERE tipo_pedido = 'mesa'
        AND status_pedido = 'fechada'
    `);

    console.log(`  Mesas fechadas total: ${mesasSemDataPedidoResult.rows[0].total}`);
    console.log(`  Com data_pedido: ${mesasSemDataPedidoResult.rows[0].com_data_pedido}`);
    console.log(`  SEM data_pedido (NULL): ${mesasSemDataPedidoResult.rows[0].sem_data_pedido}`);

    // 5. Testar com COALESCE para pegar created_at quando data_pedido é NULL
    console.log('\n🔧 Testando query corrigida com COALESCE:');
    
    const queryCorrigidaResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
        COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
        COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at)) = $1 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
        AND tipo_pedido = 'mesa'
    `, [today]);

    console.log(`  Total pedidos (com COALESCE): ${queryCorrigidaResult.rows[0].total_pedidos}`);
    console.log(`  Vendas (com COALESCE): R$ ${queryCorrigidaResult.rows[0].vendas_brutas}`);

    // 6. Verificar últimas mesas fechadas hoje
    console.log('\n📅 Últimas mesas fechadas HOJE:');
    
    const mesasHojeResult = await db.query(`
      SELECT 
        numero_mesa,
        status_pedido,
        total,
        forma_pagamento,
        data_pedido,
        created_at,
        updated_at,
        CASE 
          WHEN DATE(data_pedido) = $1 THEN 'Por data_pedido'
          WHEN DATE(created_at) = $1 THEN 'Por created_at'
          WHEN DATE(updated_at) = $1 THEN 'Por updated_at'
          ELSE 'Não é de hoje'
        END as como_identificado
      FROM pedidos
      WHERE tipo_pedido = 'mesa'
        AND status_pedido = 'fechada'
        AND (
          DATE(data_pedido) = $1 OR 
          DATE(created_at) = $1 OR 
          DATE(updated_at) = $1
        )
      ORDER BY updated_at DESC
    `, [today]);

    if (mesasHojeResult.rows.length > 0) {
      console.log(`  Encontradas ${mesasHojeResult.rows.length} mesas:`);
      mesasHojeResult.rows.forEach(mesa => {
        console.log(`    Mesa #${mesa.numero_mesa}: R$ ${mesa.total} - ${mesa.forma_pagamento}`);
        console.log(`      Status: ${mesa.status_pedido}`);
        console.log(`      Como identificado: ${mesa.como_identificado}`);
        console.log(`      Data pedido: ${mesa.data_pedido || 'NULL'}`);
        console.log(`      Created: ${mesa.created_at}`);
        console.log(`      Updated: ${mesa.updated_at}`);
      });
    } else {
      console.log('  ❌ Nenhuma mesa fechada encontrada para hoje!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await db.pool.end();
  }
}

// Executar teste
testMesaFechamento();