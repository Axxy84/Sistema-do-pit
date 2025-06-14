const db = require('./config/database');

async function checkPedidosTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela pedidos...\n');

    // Verificar se a tabela existe
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pedidos'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ A tabela pedidos NÃO existe!');
      process.exit(1);
    }

    console.log('✅ Tabela pedidos existe\n');

    // Listar todas as colunas da tabela
    const columns = await db.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pedidos'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Colunas da tabela pedidos:');
    console.log('========================================');
    columns.rows.forEach(col => {
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      
      console.log(`- ${col.column_name}: ${type} ${nullable}${defaultVal}`);
    });

    // Verificar colunas específicas necessárias para o endpoint /api/orders
    console.log('\n🔍 Verificando colunas críticas para o endpoint:');
    const criticalColumns = [
      'tipo_pedido',
      'numero_mesa', 
      'endereco_entrega',
      'taxa_entrega',
      'entregador_nome',
      'multiplos_pagamentos'
    ];

    for (const colName of criticalColumns) {
      const exists = columns.rows.some(col => col.column_name === colName);
      if (exists) {
        console.log(`✅ ${colName}: EXISTE`);
      } else {
        console.log(`❌ ${colName}: NÃO EXISTE`);
      }
    }

    // Verificar constraints
    console.log('\n📋 Constraints da tabela pedidos:');
    const constraints = await db.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'pedidos'::regclass;
    `);

    constraints.rows.forEach(constraint => {
      console.log(`- ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });

    // Verificar se há pedidos na tabela
    const countResult = await db.query('SELECT COUNT(*) as total FROM pedidos');
    console.log(`\n📊 Total de pedidos na tabela: ${countResult.rows[0].total}`);

    // Verificar um pedido de exemplo (se existir)
    const sampleResult = await db.query('SELECT * FROM pedidos LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('\n📄 Exemplo de pedido:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar tabela pedidos:', error);
    process.exit(1);
  }
}

checkPedidosTable();