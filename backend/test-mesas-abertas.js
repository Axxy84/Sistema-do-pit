const db = require('./config/database');

async function testMesasAbertas() {
  try {
    console.log('🔍 Testando query de mesas abertas...\n');

    // Query original (com erro)
    console.log('❌ Query ANTIGA (com erro):');
    console.log(`WHERE tipo_pedido = 'mesa' AND status_pedido != 'fechado'`);
    
    try {
      const resultOld = await db.query(`
        SELECT COUNT(*) as total 
        FROM pedidos 
        WHERE tipo_pedido = 'mesa' 
          AND status_pedido != 'fechado'
          AND numero_mesa IS NOT NULL
      `);
      console.log('Resultado:', resultOld.rows[0].total, 'mesas\n');
    } catch (error) {
      console.log('Erro:', error.message, '\n');
    }

    // Query corrigida
    console.log('✅ Query NOVA (corrigida):');
    console.log(`WHERE tipo_pedido = 'mesa' AND status_pedido NOT IN ('entregue', 'retirado', 'cancelado')`);
    
    const resultNew = await db.query(`
      SELECT 
        numero_mesa,
        status_pedido,
        COUNT(*) as pedidos_pendentes,
        SUM(total) as valor_pendente,
        MIN(created_at) as abertura_mesa,
        MAX(updated_at) as ultima_atividade
      FROM pedidos 
      WHERE tipo_pedido = 'mesa'
        AND status_pedido NOT IN ('entregue', 'retirado', 'cancelado')
        AND numero_mesa IS NOT NULL
      GROUP BY numero_mesa, status_pedido
      ORDER BY numero_mesa
    `);

    console.log('\nMesas abertas encontradas:', resultNew.rows.length);
    
    if (resultNew.rows.length > 0) {
      console.log('\nDetalhes das mesas abertas:');
      resultNew.rows.forEach(mesa => {
        console.log(`\nMesa #${mesa.numero_mesa}`);
        console.log(`  Status: ${mesa.status_pedido}`);
        console.log(`  Pedidos: ${mesa.pedidos_pendentes}`);
        console.log(`  Valor pendente: R$ ${parseFloat(mesa.valor_pendente).toFixed(2)}`);
        console.log(`  Aberta em: ${new Date(mesa.abertura_mesa).toLocaleString('pt-BR')}`);
      });
    }

    // Verificar todos os status existentes
    console.log('\n📊 Distribuição de status para pedidos de mesa:');
    const statusResult = await db.query(`
      SELECT 
        status_pedido,
        COUNT(*) as total
      FROM pedidos
      WHERE tipo_pedido = 'mesa'
      GROUP BY status_pedido
      ORDER BY total DESC
    `);

    statusResult.rows.forEach(row => {
      console.log(`  ${row.status_pedido}: ${row.total} pedidos`);
    });

    // Verificar se existe algum pedido com status 'fechado'
    const fechadoResult = await db.query(`
      SELECT COUNT(*) as total
      FROM pedidos
      WHERE status_pedido = 'fechado'
    `);

    console.log(`\n⚠️  Pedidos com status 'fechado': ${fechadoResult.rows[0].total}`);
    
    if (fechadoResult.rows[0].total > 0) {
      console.log('   ATENÇÃO: Existem pedidos com status inválido "fechado"!');
      console.log('   Estes pedidos devem ser migrados para "entregue" ou "retirado".');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await db.end();
  }
}

testMesasAbertas();