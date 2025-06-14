const { Client } = require('pg');

async function checkMesaStatus() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pizzaria_db',
    user: 'postgres',
    password: '8477'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco');
    
    // Verificar todos os pedidos de mesa
    const allMesas = await client.query(`
      SELECT 
        id,
        numero_mesa,
        status_pedido,
        total,
        created_at,
        tipo_pedido
      FROM pedidos 
      WHERE tipo_pedido = 'mesa'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Últimos pedidos de mesa:');
    allMesas.rows.forEach(p => {
      console.log(`Mesa ${p.numero_mesa}: ${p.status_pedido} - R$ ${p.total} - ${new Date(p.created_at).toLocaleString('pt-BR')}`);
    });
    
    // Verificar mesas abertas (query atual)
    const mesasAbertas = await client.query(`
      SELECT 
        numero_mesa,
        COUNT(*) as total_pedidos,
        SUM(total) as valor_total,
        MIN(created_at) as abertura,
        MAX(updated_at) as ultima_atividade,
        MAX(status_pedido) as status_pedido
      FROM pedidos 
      WHERE tipo_pedido = 'mesa'
        AND status_pedido NOT IN ('entregue', 'cancelado')
        AND numero_mesa IS NOT NULL
      GROUP BY numero_mesa
      ORDER BY numero_mesa
    `);
    
    console.log('\n🔓 Mesas abertas (status != entregue/cancelado):');
    mesasAbertas.rows.forEach(m => {
      console.log(`Mesa ${m.numero_mesa}: ${m.total_pedidos} pedidos, Total: R$ ${m.valor_total}`);
    });
    
    // Verificar mesas com QUALQUER status
    const todasMesas = await client.query(`
      SELECT 
        numero_mesa,
        COUNT(*) as total_pedidos,
        SUM(total) as valor_total,
        array_agg(DISTINCT status_pedido) as todos_status
      FROM pedidos 
      WHERE tipo_pedido = 'mesa'
        AND numero_mesa IS NOT NULL
      GROUP BY numero_mesa
      ORDER BY numero_mesa
    `);
    
    console.log('\n📊 Todas as mesas (qualquer status):');
    todasMesas.rows.forEach(m => {
      console.log(`Mesa ${m.numero_mesa}: ${m.total_pedidos} pedidos, Total: R$ ${m.valor_total}, Status: ${m.todos_status.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkMesaStatus();