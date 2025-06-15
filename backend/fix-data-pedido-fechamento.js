const db = require('./config/database');

async function fixDataPedidoFechamento() {
  try {
    console.log('🔧 Verificando e corrigindo problema de data_pedido no fechamento de mesa...\n');

    // 1. Verificar pedidos de mesa onde data_pedido é diferente de updated_at (quando foi fechada)
    const problemasResult = await db.query(`
      SELECT 
        id,
        numero_mesa,
        status_pedido,
        total,
        forma_pagamento,
        data_pedido,
        created_at,
        updated_at,
        DATE(data_pedido) as data_pedido_date,
        DATE(updated_at) as data_fechamento_date
      FROM pedidos
      WHERE tipo_pedido = 'mesa'
        AND status_pedido = 'fechada'
        AND DATE(data_pedido) != DATE(updated_at)
      ORDER BY updated_at DESC
    `);

    if (problemasResult.rows.length > 0) {
      console.log(`⚠️ Encontrados ${problemasResult.rows.length} pedidos com data inconsistente:`);
      
      problemasResult.rows.forEach(pedido => {
        console.log(`\n  Mesa #${pedido.numero_mesa}:`);
        console.log(`    ID: ${pedido.id}`);
        console.log(`    Total: R$ ${pedido.total}`);
        console.log(`    Data pedido (criação): ${pedido.data_pedido_date}`);
        console.log(`    Data fechamento: ${pedido.data_fechamento_date}`);
        console.log(`    ⚠️ Mesa criada em ${pedido.data_pedido_date} mas fechada em ${pedido.data_fechamento_date}`);
      });

      console.log('\n❓ Deseja atualizar a data_pedido para a data de fechamento? (Isso fará as mesas aparecerem no dia correto)');
      console.log('   NOTA: Normalmente, a data_pedido deve representar quando o pedido foi criado.');
      console.log('   Esta correção é apenas para fins de demonstração.');
      
    } else {
      console.log('✅ Nenhum problema encontrado. Todas as mesas fechadas têm datas consistentes.');
    }

    // 2. Verificar o endpoint de fechamento de mesa
    console.log('\n📝 Analisando endpoint de fechamento de mesa...');
    console.log('   O endpoint /orders/mesa/:numero/fechar-conta atualiza apenas o status.');
    console.log('   A data_pedido permanece como a data original de criação do pedido.');
    console.log('\n   Isso é o comportamento CORRETO! A data_pedido deve representar quando');
    console.log('   o pedido foi criado, não quando foi fechado.');

    // 3. Sugestão de melhoria
    console.log('\n💡 Sugestão de implementação:');
    console.log('   Para rastrear quando uma mesa foi fechada, podemos usar:');
    console.log('   1. updated_at (já usado) - mostra última atualização');
    console.log('   2. Adicionar campo data_fechamento específico');
    console.log('   3. Usar o campo observacoes para registrar data/hora de fechamento');

    // 4. Mostrar query correta para fechamento de caixa
    console.log('\n✅ Query correta para fechamento de caixa:');
    console.log('   A query atual já está correta, usando DATE(data_pedido) para agrupar');
    console.log('   pedidos pelo dia em que foram CRIADOS, não fechados.');
    console.log('\n   Se quiser incluir mesas fechadas hoje mas criadas em dias anteriores,');
    console.log('   seria necessário uma lógica diferente ou um relatório específico.');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await db.pool.end();
  }
}

// Executar
fixDataPedidoFechamento();