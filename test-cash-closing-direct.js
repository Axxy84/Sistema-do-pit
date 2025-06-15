#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

async function testCashClosingDirect() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pizzaria_db',
    user: 'postgres',
    password: '8477'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Testar query original (com problema)
    console.log('1️⃣ Testando query ORIGINAL (com problema)...');
    const today = new Date().toISOString().split('T')[0];
    console.log(`   Data sendo usada: ${today}`);
    
    const originalResult = await client.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas
      FROM pedidos 
      WHERE DATE(data_pedido) = $1 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `, [today]);
    
    console.log(`   Resultado: ${originalResult.rows[0].total_pedidos} pedidos, R$ ${originalResult.rows[0].vendas_brutas}`);
    console.log('');

    // 2. Testar query corrigida
    console.log('2️⃣ Testando query CORRIGIDA (com timezone)...');
    const correctedResult = await client.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at) AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `);
    
    console.log(`   Resultado: ${correctedResult.rows[0].total_pedidos} pedidos, R$ ${correctedResult.rows[0].vendas_brutas}`);
    console.log('');

    // 3. Verificar detalhes por tipo
    console.log('3️⃣ Testando detalhes por tipo de pedido...');
    const detailsResult = await client.query(`
      SELECT 
        tipo_pedido,
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at) AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
      GROUP BY tipo_pedido
    `);
    
    console.log('   Resultados por tipo:');
    detailsResult.rows.forEach(row => {
      console.log(`   - ${row.tipo_pedido}: ${row.total_pedidos} pedidos, R$ ${row.vendas_brutas}`);
    });
    console.log('');

    // 4. Listar pedidos do dia para debug
    console.log('4️⃣ Listando pedidos de hoje para debug...');
    const pedidosHoje = await client.query(`
      SELECT 
        id,
        tipo_pedido,
        status_pedido,
        total,
        data_pedido,
        created_at,
        DATE(COALESCE(data_pedido, created_at) AT TIME ZONE 'America/Sao_Paulo') as data_convertida,
        CURRENT_DATE as data_atual
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at) AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`   Total de pedidos hoje: ${pedidosHoje.rows.length}`);
    pedidosHoje.rows.forEach(pedido => {
      console.log(`\n   ID: ${pedido.id}`);
      console.log(`   Tipo: ${pedido.tipo_pedido} | Status: ${pedido.status_pedido} | Total: R$ ${pedido.total}`);
      console.log(`   Data pedido: ${pedido.data_pedido}`);
      console.log(`   Created at: ${pedido.created_at}`);
      console.log(`   Data convertida: ${pedido.data_convertida}`);
      console.log(`   Data atual sistema: ${pedido.data_atual}`);
    });

    // 5. Conclusão
    console.log('\n📊 ANÁLISE:');
    if (correctedResult.rows[0].total_pedidos > originalResult.rows[0].total_pedidos) {
      console.log('✅ A correção do timezone RESOLVEU o problema!');
      console.log(`   Agora estamos capturando ${correctedResult.rows[0].total_pedidos} pedidos ao invés de ${originalResult.rows[0].total_pedidos}`);
    } else if (correctedResult.rows[0].total_pedidos === 0) {
      console.log('⚠️  Ainda não há pedidos entregues hoje. Marque um pedido como entregue e teste novamente.');
    } else {
      console.log('ℹ️  As duas queries retornaram o mesmo resultado.');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

testCashClosingDirect();