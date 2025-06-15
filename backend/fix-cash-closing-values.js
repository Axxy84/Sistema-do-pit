const db = require('./config/database');

async function fixCashClosingValues() {
  try {
    console.log('🔧 Corrigindo valores de fechamento de caixa...\n');
    
    // 1. Buscar fechamento incorreto do dia 15/06/2025
    const incorrectClosing = await db.query(`
      SELECT * FROM fechamento_caixa 
      WHERE data_fechamento = '2025-06-15'
    `);
    
    if (incorrectClosing.rows.length === 0) {
      console.log('❌ Nenhum fechamento encontrado para 15/06/2025');
      process.exit(0);
    }
    
    console.log('📊 Fechamento atual (INCORRETO):');
    console.log(`- Total vendas: R$ ${incorrectClosing.rows[0].total_vendas}`);
    console.log(`- Saldo final: R$ ${incorrectClosing.rows[0].saldo_final}\n`);
    
    // 2. Buscar valores reais dos pedidos
    const realSales = await db.query(`
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
      WHERE DATE(created_at) = '2025-06-15'
        AND status_pedido IN ('entregue', 'fechada')
    `);
    
    // 3. Buscar detalhes por tipo
    const detailsByType = await db.query(`
      SELECT 
        tipo_pedido,
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(SUM(taxa_entrega), 0) as total_taxas_entrega
      FROM pedidos 
      WHERE DATE(created_at) = '2025-06-15'
        AND status_pedido IN ('entregue', 'fechada')
      GROUP BY tipo_pedido
    `);
    
    const realData = realSales.rows[0];
    console.log('✅ Valores CORRETOS dos pedidos:');
    console.log(`- Total pedidos: ${realData.total_pedidos}`);
    console.log(`- Vendas brutas: R$ ${realData.vendas_brutas}`);
    console.log(`- Dinheiro: ${realData.pedidos_dinheiro} pedidos = R$ ${realData.vendas_dinheiro}`);
    console.log(`- Cartão: ${realData.pedidos_cartao} pedidos = R$ ${realData.vendas_cartao}`);
    console.log(`- PIX: ${realData.pedidos_pix} pedidos = R$ ${realData.vendas_pix}\n`);
    
    // 4. Preparar novo JSON vendas_por_metodo
    const vendas_por_metodo = {
      dinheiro: {
        name: "Dinheiro",
        count: parseInt(realData.pedidos_dinheiro),
        total: parseFloat(realData.vendas_dinheiro)
      },
      cartao: {
        name: "Cartão", 
        count: parseInt(realData.pedidos_cartao),
        total: parseFloat(realData.vendas_cartao)
      },
      pix: {
        name: "PIX",
        count: parseInt(realData.pedidos_pix),
        total: parseFloat(realData.vendas_pix)
      },
      details_by_type: detailsByType.rows
    };
    
    // 5. Atualizar o fechamento com valores corretos
    const updateResult = await db.query(`
      UPDATE fechamento_caixa 
      SET 
        total_vendas = $1,
        saldo_final = $2,
        total_pedidos = $3,
        vendas_por_metodo = $4,
        observacoes = $5
      WHERE data_fechamento = '2025-06-15'
      RETURNING *
    `, [
      realData.vendas_brutas,
      realData.vendas_brutas, // saldo = vendas (sem despesas registradas)
      realData.total_pedidos,
      JSON.stringify(vendas_por_metodo),
      'Valores corrigidos automaticamente - fechamento anterior tinha dados incorretos'
    ]);
    
    console.log('🎯 Fechamento ATUALIZADO:');
    console.log(`- Total vendas: R$ ${updateResult.rows[0].total_vendas}`);
    console.log(`- Saldo final: R$ ${updateResult.rows[0].saldo_final}`);
    console.log(`- Total pedidos: ${updateResult.rows[0].total_pedidos}`);
    
    console.log('\n✅ Correção concluída com sucesso!');
    console.log('💡 Limpe o cache do sistema para ver as alterações imediatamente.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao corrigir fechamento:', error);
    process.exit(1);
  }
}

fixCashClosingValues();