const db = require('./config/database');

async function testMesaSync() {
  console.log('🔍 Testando sincronização de fechamento de mesa com fechamento de caixa\n');

  try {
    // 1. Buscar uma mesa que esteja aberta (retirado) hoje
    const openMesaResult = await db.query(`
      SELECT id, numero_pedido, numero_mesa, tipo_pedido, status_pedido, total, forma_pagamento
      FROM pedidos 
      WHERE tipo_pedido = 'mesa' 
        AND status_pedido = 'retirado'
        AND DATE(data_pedido) = CURRENT_DATE
      LIMIT 1
    `);

    if (openMesaResult.rows.length === 0) {
      console.log('❌ Nenhuma mesa aberta (status retirado) encontrada hoje.');
      console.log('💡 Para testar, crie um pedido de mesa e marque como "retirado" primeiro.\n');
      
      // Mostrar mesas disponíveis para teste
      const mesasResult = await db.query(`
        SELECT id, numero_pedido, numero_mesa, status_pedido, total
        FROM pedidos 
        WHERE tipo_pedido = 'mesa' 
          AND DATE(data_pedido) = CURRENT_DATE
          AND status_pedido NOT IN ('cancelado', 'fechada')
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      if (mesasResult.rows.length > 0) {
        console.log('📋 Mesas disponíveis hoje:');
        mesasResult.rows.forEach(mesa => {
          console.log(`   Mesa #${mesa.numero_mesa} - Status: ${mesa.status_pedido} - Total: R$ ${mesa.total}`);
        });
      }
      
      return;
    }

    const mesa = openMesaResult.rows[0];
    console.log('🍽️ Mesa encontrada:');
    console.log(`   ID: ${mesa.id}`);
    console.log(`   Número da Mesa: ${mesa.numero_mesa}`);
    console.log(`   Status: ${mesa.status_pedido}`);
    console.log(`   Total: R$ ${mesa.total}`);
    console.log(`   Forma Pagamento: ${mesa.forma_pagamento}\n`);

    // 2. Buscar dados atuais do fechamento ANTES de fechar a mesa
    console.log('📊 Dados do fechamento ANTES de fechar a mesa:');
    const beforeResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COUNT(CASE WHEN tipo_pedido = 'mesa' THEN 1 END) as pedidos_mesa,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'mesa' THEN total ELSE 0 END), 0) as vendas_mesa,
        COUNT(CASE WHEN tipo_pedido = 'mesa' AND status_pedido = 'fechada' THEN 1 END) as mesas_fechadas
      FROM pedidos 
      WHERE DATE(data_pedido) = CURRENT_DATE 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `);

    const before = beforeResult.rows[0];
    console.log(`   Total de pedidos: ${before.total_pedidos}`);
    console.log(`   Vendas brutas: R$ ${before.vendas_brutas}`);
    console.log(`   Pedidos mesa: ${before.pedidos_mesa}`);
    console.log(`   Vendas mesa: R$ ${before.vendas_mesa}`);
    console.log(`   Mesas fechadas: ${before.mesas_fechadas}\n`);

    // 3. Fechar a mesa
    console.log('💰 Fechando a mesa (mudando status para "fechada")...');
    await db.query(`
      UPDATE pedidos 
      SET status_pedido = 'fechada', 
          updated_at = NOW()
      WHERE id = $1
    `, [mesa.id]);

    // 4. Buscar dados atuais do fechamento DEPOIS de fechar a mesa
    console.log('\n📊 Dados do fechamento DEPOIS de fechar a mesa:');
    const afterResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COUNT(CASE WHEN tipo_pedido = 'mesa' THEN 1 END) as pedidos_mesa,
        COALESCE(SUM(CASE WHEN tipo_pedido = 'mesa' THEN total ELSE 0 END), 0) as vendas_mesa,
        COUNT(CASE WHEN tipo_pedido = 'mesa' AND status_pedido = 'fechada' THEN 1 END) as mesas_fechadas
      FROM pedidos 
      WHERE DATE(data_pedido) = CURRENT_DATE 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `);

    const after = afterResult.rows[0];
    console.log(`   Total de pedidos: ${after.total_pedidos} (${after.total_pedidos === before.total_pedidos ? 'sem mudança' : '+1'})`);
    console.log(`   Vendas brutas: R$ ${after.vendas_brutas} (${after.vendas_brutas === before.vendas_brutas ? 'sem mudança' : '+R$ ' + (after.vendas_brutas - before.vendas_brutas).toFixed(2)})`);
    console.log(`   Pedidos mesa: ${after.pedidos_mesa} (${after.pedidos_mesa === before.pedidos_mesa ? 'sem mudança' : '+1'})`);
    console.log(`   Vendas mesa: R$ ${after.vendas_mesa} (${after.vendas_mesa === before.vendas_mesa ? 'sem mudança' : '+R$ ' + (after.vendas_mesa - before.vendas_mesa).toFixed(2)})`);
    console.log(`   Mesas fechadas: ${after.mesas_fechadas} (+1)\n`);

    // 5. Verificar se a mudança foi refletida
    if (after.mesas_fechadas > before.mesas_fechadas) {
      console.log('✅ Mesa foi marcada como fechada!');
      
      if (after.vendas_brutas === before.vendas_brutas) {
        console.log('⚠️  ATENÇÃO: O valor da mesa já estava incluído no fechamento!');
        console.log('   Isso é ESPERADO porque mesas com status "retirado" já são contabilizadas.');
        console.log('   O sistema considera "retirado" como mesa em consumo (já contabilizada).');
        console.log('   "Fechada" apenas indica que o pagamento foi recebido.\n');
        console.log('📌 Comportamento correto do sistema:');
        console.log('   - Status "retirado" = Mesa ativa/consumindo (JÁ conta no fechamento)');
        console.log('   - Status "fechada" = Mesa paga e liberada (não altera valores)');
      } else {
        console.log('✅ Valores foram atualizados no fechamento!');
      }
    } else {
      console.log('❌ PROBLEMA: A mesa não foi incluída como fechada!');
    }

    // 6. Testar query específica do fechamento separado
    console.log('\n🔍 Testando query do fechamento separado por tipo:');
    const separateResult = await db.query(`
      SELECT 
        tipo_pedido,
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas
      FROM pedidos 
      WHERE DATE(data_pedido) = CURRENT_DATE 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
      GROUP BY tipo_pedido
    `);

    console.log('📊 Resumo por tipo de pedido:');
    separateResult.rows.forEach(row => {
      console.log(`   ${row.tipo_pedido}: ${row.total_pedidos} pedidos - R$ ${row.vendas_brutas}`);
    });

    // 7. Restaurar status original para permitir novos testes
    console.log('\n🔄 Restaurando mesa para status "retirado" para permitir novos testes...');
    await db.query(`
      UPDATE pedidos 
      SET status_pedido = 'retirado', 
          updated_at = NOW()
      WHERE id = $1
    `, [mesa.id]);

    console.log('\n💡 RESUMO DO COMPORTAMENTO:');
    console.log('   1. Mesas com status "retirado" JÁ aparecem no fechamento de caixa');
    console.log('   2. Mudar para "fechada" não altera valores (mesa já estava contabilizada)');
    console.log('   3. Isso é o comportamento CORRETO do sistema');
    console.log('   4. Para ver mudanças no valor, teste com mesas em status anterior a "retirado"');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await db.end();
  }
}

console.log('='.repeat(80));
console.log('TESTE DE SINCRONIZAÇÃO: FECHAMENTO DE MESA → FECHAMENTO DE CAIXA');
console.log('='.repeat(80));

testMesaSync();