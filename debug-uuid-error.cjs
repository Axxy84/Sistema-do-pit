const { Pool } = require('pg');

const pool = new Pool({
  user: 'thiago',
  host: '192.168.0.105',
  database: 'pizzaria_db',
  password: 'senha123',
  port: 5432,
});

async function debugUUIDError() {
  console.log('🔍 DEBUGANDO ERRO DE UUID NA CRIAÇÃO DE PEDIDOS');
  console.log('===============================================');

  try {
    // 1. Verificar schema da tabela pedidos
    console.log('\n📋 1. Schema da tabela pedidos:');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas UUID na tabela pedidos:');
    schemaResult.rows.forEach(row => {
      if (row.data_type === 'uuid') {
        console.log(`  • ${row.column_name} (${row.data_type}) - nullable: ${row.is_nullable}`);
      }
    });

    // 2. Verificar schema da tabela itens_pedido
    console.log('\n📋 2. Schema da tabela itens_pedido:');
    const itensSchemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'itens_pedido'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas UUID na tabela itens_pedido:');
    itensSchemaResult.rows.forEach(row => {
      if (row.data_type === 'uuid') {
        console.log(`  • ${row.column_name} (${row.data_type}) - nullable: ${row.is_nullable}`);
      }
    });

    // 3. Testar inserção simples com valores nulos/inválidos
    console.log('\n🧪 3. Testando inserção com UUIDs problemáticos...');
    
    try {
      const testResult = await pool.query(`
        INSERT INTO pedidos (
          cliente_id, total, forma_pagamento, status_pedido, tipo_pedido, endereco_entrega
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        null, // cliente_id como null
        35.50,
        'dinheiro',
        'pendente',
        'delivery',
        'Rua Teste, 123'
      ]);
      
      const pedidoId = testResult.rows[0].id;
      console.log(`✅ Pedido criado com sucesso: ${pedidoId}`);
      
      // Tentar inserir item com produto_id_ref inválido
      try {
        await pool.query(`
          INSERT INTO itens_pedido (
            pedido_id, produto_id_ref, sabor_registrado, quantidade, valor_unitario
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          pedidoId,
          '4', // Valor inválido que causa o erro
          'Margherita',
          1,
          30.50
        ]);
        console.log('❌ Não deveria ter chegado aqui - o erro deveria ter ocorrido');
      } catch (itemError) {
        console.log('✅ Erro capturado ao inserir item:');
        console.log(`   ${itemError.message}`);
        console.log('   👆 Este é o erro que está acontecendo!');
      }
      
      // Limpar o teste
      await pool.query('DELETE FROM pedidos WHERE id = $1', [pedidoId]);
      console.log('🧹 Pedido de teste removido');
      
    } catch (pedidoError) {
      console.log('❌ Erro ao criar pedido teste:');
      console.log(`   ${pedidoError.message}`);
    }

    // 4. Mostrar correção necessária
    console.log('\n🔧 4. CORREÇÃO NECESSÁRIA:');
    console.log('=========================');
    console.log('O problema está no campo produto_id_ref da tabela itens_pedido.');
    console.log('Valores como "4" são string, mas o campo espera UUID.');
    console.log('\n💡 SOLUÇÕES:');
    console.log('1. ✅ Validação no backend (já implementada)');
    console.log('2. 🔧 Verificar se o servidor foi reiniciado');
    console.log('3. 🔧 Converter produto_id_ref para NULL quando inválido');

  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  } finally {
    await pool.end();
  }
}

debugUUIDError().catch(console.error); 