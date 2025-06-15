#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

async function checkPedidoDates() {
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

    // 1. Verificar estrutura da tabela pedidos
    console.log('1️⃣ Verificando colunas da tabela pedidos...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
        AND column_name IN ('data_pedido', 'created_at', 'updated_at')
      ORDER BY ordinal_position
    `);
    console.log('Colunas de data encontradas:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // 2. Verificar pedidos recentes
    console.log('2️⃣ Verificando últimos 5 pedidos...');
    const recentPedidosResult = await client.query(`
      SELECT 
        id,
        status_pedido,
        tipo_pedido,
        total,
        data_pedido,
        created_at,
        updated_at
      FROM pedidos 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Pedidos recentes:');
    recentPedidosResult.rows.forEach(pedido => {
      console.log(`\n   ID: ${pedido.id}`);
      console.log(`   Status: ${pedido.status_pedido} | Tipo: ${pedido.tipo_pedido} | Total: R$ ${pedido.total}`);
      console.log(`   data_pedido: ${pedido.data_pedido || 'NULL'}`);
      console.log(`   created_at: ${pedido.created_at}`);
      console.log(`   updated_at: ${pedido.updated_at}`);
    });
    console.log('');

    // 3. Verificar pedidos sem data_pedido
    console.log('3️⃣ Verificando pedidos sem data_pedido...');
    const semDataResult = await client.query(`
      SELECT COUNT(*) as total
      FROM pedidos 
      WHERE data_pedido IS NULL
    `);
    console.log(`   Total de pedidos sem data_pedido: ${semDataResult.rows[0].total}`);
    console.log('');

    // 4. Verificar pedidos de hoje usando created_at vs data_pedido
    const today = new Date().toISOString().split('T')[0];
    console.log(`4️⃣ Comparando pedidos de hoje (${today})...`);
    
    const porDataPedidoResult = await client.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as vendas
      FROM pedidos 
      WHERE DATE(data_pedido) = $1 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `, [today]);
    
    const porCreatedAtResult = await client.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as vendas
      FROM pedidos 
      WHERE DATE(created_at) = $1 
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `, [today]);
    
    console.log(`   Usando data_pedido: ${porDataPedidoResult.rows[0].total} pedidos, R$ ${porDataPedidoResult.rows[0].vendas}`);
    console.log(`   Usando created_at: ${porCreatedAtResult.rows[0].total} pedidos, R$ ${porCreatedAtResult.rows[0].vendas}`);
    console.log('');

    // 5. Sugestão de correção
    if (semDataResult.rows[0].total > 0) {
      console.log('⚠️  PROBLEMA IDENTIFICADO!');
      console.log(`   Existem ${semDataResult.rows[0].total} pedidos sem data_pedido preenchida.`);
      console.log('   Isso faz com que o fechamento de caixa não contabilize esses pedidos.\n');
      
      console.log('🔧 SUGESTÃO DE CORREÇÃO:');
      console.log('   Execute o seguinte SQL para corrigir:');
      console.log('   UPDATE pedidos SET data_pedido = created_at WHERE data_pedido IS NULL;');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkPedidoDates();