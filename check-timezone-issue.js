#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

async function checkTimezoneIssue() {
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

    // 1. Verificar timezone do servidor
    console.log('1️⃣ Verificando configurações de timezone...');
    const timezoneResult = await client.query('SHOW timezone');
    console.log(`   Timezone do PostgreSQL: ${timezoneResult.rows[0].timezone}`);
    
    const nowResult = await client.query('SELECT NOW() as server_time, CURRENT_DATE as server_date');
    console.log(`   Hora do servidor: ${nowResult.rows[0].server_time}`);
    console.log(`   Data do servidor: ${nowResult.rows[0].server_date}`);
    console.log('');

    // 2. Verificar hora local do Node.js
    console.log('2️⃣ Verificando hora local do Node.js...');
    const nodeNow = new Date();
    console.log(`   Hora local Node.js: ${nodeNow}`);
    console.log(`   ISO String: ${nodeNow.toISOString()}`);
    console.log(`   Data local: ${nodeNow.toISOString().split('T')[0]}`);
    console.log('');

    // 3. Verificar pedidos de hoje considerando timezone
    console.log('3️⃣ Verificando pedidos com diferentes abordagens de data...');
    
    // Abordagem 1: Usar DATE com timezone
    const approach1 = await client.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(total), 0) as vendas,
        MIN(data_pedido) as primeiro_pedido,
        MAX(data_pedido) as ultimo_pedido
      FROM pedidos 
      WHERE DATE(data_pedido AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `);
    
    console.log('   Abordagem 1 (AT TIME ZONE):');
    console.log(`   - Total: ${approach1.rows[0].total} pedidos`);
    console.log(`   - Vendas: R$ ${approach1.rows[0].vendas}`);
    console.log(`   - Primeiro: ${approach1.rows[0].primeiro_pedido}`);
    console.log(`   - Último: ${approach1.rows[0].ultimo_pedido}`);
    console.log('');

    // Abordagem 2: Usar intervalo de datas
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const approach2 = await client.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(total), 0) as vendas
      FROM pedidos 
      WHERE data_pedido >= $1 AND data_pedido <= $2
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `, [startOfDay, endOfDay]);
    
    console.log('   Abordagem 2 (Intervalo de datas):');
    console.log(`   - Total: ${approach2.rows[0].total} pedidos`);
    console.log(`   - Vendas: R$ ${approach2.rows[0].vendas}`);
    console.log('');

    // 4. Verificar pedidos das últimas 24 horas
    console.log('4️⃣ Pedidos das últimas 24 horas...');
    const last24h = await client.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(total), 0) as vendas,
        COUNT(CASE WHEN status_pedido = 'entregue' THEN 1 END) as entregues,
        COUNT(CASE WHEN status_pedido = 'retirado' THEN 1 END) as retirados,
        COUNT(CASE WHEN status_pedido = 'fechada' THEN 1 END) as fechados
      FROM pedidos 
      WHERE data_pedido >= NOW() - INTERVAL '24 hours'
    `);
    
    console.log(`   Total: ${last24h.rows[0].total} pedidos`);
    console.log(`   Vendas: R$ ${last24h.rows[0].vendas}`);
    console.log(`   - Entregues: ${last24h.rows[0].entregues}`);
    console.log(`   - Retirados: ${last24h.rows[0].retirados}`);
    console.log(`   - Fechados: ${last24h.rows[0].fechados}`);
    console.log('');

    // 5. Sugestão de correção
    console.log('🔧 ANÁLISE DO PROBLEMA:');
    console.log('   O problema está relacionado ao timezone. As queries estão buscando por DATE(data_pedido)');
    console.log('   mas isso pode resultar em datas diferentes dependendo do timezone.');
    console.log('\n   SOLUÇÕES POSSÍVEIS:');
    console.log('   1. Usar DATE(data_pedido AT TIME ZONE \'America/Sao_Paulo\')');
    console.log('   2. Usar COALESCE(data_pedido, created_at) para garantir que sempre há uma data');
    console.log('   3. Usar intervalo de datas ao invés de DATE()');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkTimezoneIssue();