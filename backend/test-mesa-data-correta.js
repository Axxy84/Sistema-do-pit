const db = require('./config/database');

async function testMesaDataCorreta() {
  try {
    console.log('🔍 Testando busca de mesas fechadas com a data correta...\n');

    // Data de ontem (14/06/2025)
    const ontem = '2025-06-14';
    const hoje = '2025-06-15';
    
    console.log(`📅 Data de ontem: ${ontem}`);
    console.log(`📅 Data de hoje: ${hoje}\n`);

    // 1. Buscar mesas fechadas ontem
    console.log('🔍 Buscando mesas fechadas ONTEM (14/06):');
    
    const mesasOntemResult = await db.query(`
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
    `, [ontem]);

    console.log(`  Total pedidos mesa: ${mesasOntemResult.rows[0].total_pedidos}`);
    console.log(`  Vendas mesa: R$ ${mesasOntemResult.rows[0].vendas_brutas}`);
    console.log(`  - Dinheiro: R$ ${mesasOntemResult.rows[0].vendas_dinheiro} (${mesasOntemResult.rows[0].pedidos_dinheiro} pedidos)`);
    console.log(`  - Cartão: R$ ${mesasOntemResult.rows[0].vendas_cartao} (${mesasOntemResult.rows[0].pedidos_cartao} pedidos)`);
    console.log(`  - PIX: R$ ${mesasOntemResult.rows[0].vendas_pix} (${mesasOntemResult.rows[0].pedidos_pix} pedidos)`);

    // 2. Verificar detalhes da mesa fechada
    console.log('\n📋 Detalhes das mesas fechadas ontem:');
    
    const detalhesResult = await db.query(`
      SELECT 
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
        AND DATE(COALESCE(data_pedido, created_at)) = $1
      ORDER BY updated_at DESC
    `, [ontem]);

    if (detalhesResult.rows.length > 0) {
      detalhesResult.rows.forEach(mesa => {
        console.log(`  Mesa #${mesa.numero_mesa}:`);
        console.log(`    Total: R$ ${mesa.total}`);
        console.log(`    Forma pagamento: ${mesa.forma_pagamento}`);
        console.log(`    Status: ${mesa.status_pedido}`);
        console.log(`    Data pedido: ${mesa.data_pedido}`);
        console.log(`    Created: ${mesa.created_at}`);
        console.log(`    Updated: ${mesa.updated_at}`);
      });
    }

    // 3. Simular a query do fechamento de caixa separado para ontem
    console.log('\n📊 Simulando fechamento de caixa separado para ONTEM:');
    
    const separadoResult = await db.query(`
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
      WHERE DATE(COALESCE(data_pedido, created_at)) = $1 
        AND status_pedido IN ('entregue', 'fechada')
        AND tipo_pedido = 'mesa'
    `, [ontem]);

    const mesa = separadoResult.rows[0];
    console.log(`  Total pedidos: ${mesa.total_pedidos}`);
    console.log(`  Vendas brutas: R$ ${mesa.vendas_brutas}`);
    console.log(`  Vendas por método:`);
    console.log(`    - Dinheiro: R$ ${mesa.vendas_dinheiro} (${mesa.pedidos_dinheiro} pedidos)`);
    console.log(`    - Cartão: R$ ${mesa.vendas_cartao} (${mesa.pedidos_cartao} pedidos)`);
    console.log(`    - PIX: R$ ${mesa.vendas_pix} (${mesa.pedidos_pix} pedidos)`);

    // 4. Verificar se está aparecendo no fechamento geral
    console.log('\n📊 Verificando fechamento de caixa GERAL para ontem:');
    
    const geralResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COUNT(CASE WHEN tipo_pedido = 'mesa' THEN 1 END) as pedidos_mesa,
        COUNT(CASE WHEN tipo_pedido = 'delivery' THEN 1 END) as pedidos_delivery,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'mesa' THEN total ELSE 0 END), 0) as vendas_mesa,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'delivery' THEN total ELSE 0 END), 0) as vendas_delivery
      FROM pedidos 
      WHERE DATE(data_pedido) = $1 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `, [ontem]);

    const geral = geralResult.rows[0];
    console.log(`  Total geral pedidos: ${geral.total_pedidos}`);
    console.log(`  Total geral vendas: R$ ${geral.vendas_brutas}`);
    console.log(`  - Pedidos mesa: ${geral.pedidos_mesa} (R$ ${geral.vendas_mesa})`);
    console.log(`  - Pedidos delivery: ${geral.pedidos_delivery} (R$ ${geral.vendas_delivery})`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await db.pool.end();
  }
}

// Executar teste
testMesaDataCorreta();