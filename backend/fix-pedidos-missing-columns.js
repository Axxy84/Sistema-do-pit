const db = require('./config/database');

async function fixPedidosTable() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔧 Iniciando correção da tabela pedidos...\n');
    
    await client.query('BEGIN');

    // 1. Adicionar coluna tipo_pedido
    console.log('📋 Adicionando coluna tipo_pedido...');
    const tipoPedidoExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'tipo_pedido'
    `);
    
    if (tipoPedidoExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE pedidos 
        ADD COLUMN tipo_pedido VARCHAR(50) DEFAULT 'delivery' 
        CHECK (tipo_pedido IN ('delivery', 'mesa'))
      `);
      
      await client.query(`
        COMMENT ON COLUMN pedidos.tipo_pedido IS 'Tipo do pedido: delivery ou mesa'
      `);
      
      console.log('✅ Coluna tipo_pedido adicionada com sucesso');
    } else {
      console.log('ℹ️ Coluna tipo_pedido já existe');
    }

    // 2. Adicionar coluna numero_mesa
    console.log('\n📋 Adicionando coluna numero_mesa...');
    const numeroMesaExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'numero_mesa'
    `);
    
    if (numeroMesaExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE pedidos 
        ADD COLUMN numero_mesa INTEGER DEFAULT NULL
      `);
      
      await client.query(`
        COMMENT ON COLUMN pedidos.numero_mesa IS 'Número da mesa (apenas para pedidos tipo mesa)'
      `);
      
      console.log('✅ Coluna numero_mesa adicionada com sucesso');
    } else {
      console.log('ℹ️ Coluna numero_mesa já existe');
    }

    // 3. Adicionar coluna endereco_entrega
    console.log('\n📋 Adicionando coluna endereco_entrega...');
    const enderecoEntregaExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'endereco_entrega'
    `);
    
    if (enderecoEntregaExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE pedidos 
        ADD COLUMN endereco_entrega TEXT DEFAULT NULL
      `);
      
      await client.query(`
        COMMENT ON COLUMN pedidos.endereco_entrega IS 'Endereço de entrega (apenas para pedidos tipo delivery)'
      `);
      
      console.log('✅ Coluna endereco_entrega adicionada com sucesso');
    } else {
      console.log('ℹ️ Coluna endereco_entrega já existe');
    }

    // 4. Adicionar constraint para validar tipo_pedido com numero_mesa
    console.log('\n📋 Adicionando constraint de validação...');
    try {
      await client.query(`
        ALTER TABLE pedidos
        ADD CONSTRAINT check_tipo_pedido_mesa
        CHECK (
          (tipo_pedido = 'mesa' AND numero_mesa IS NOT NULL) OR
          (tipo_pedido = 'delivery' AND numero_mesa IS NULL)
        )
      `);
      console.log('✅ Constraint check_tipo_pedido_mesa adicionada');
    } catch (error) {
      if (error.code === '42710') { // duplicate object
        console.log('ℹ️ Constraint check_tipo_pedido_mesa já existe');
      } else {
        throw error;
      }
    }

    // 5. Adicionar constraint para validar tipo_pedido com endereco_entrega
    console.log('\n📋 Adicionando constraint de endereço...');
    try {
      await client.query(`
        ALTER TABLE pedidos
        ADD CONSTRAINT check_tipo_pedido_endereco
        CHECK (
          (tipo_pedido = 'delivery' AND endereco_entrega IS NOT NULL) OR
          (tipo_pedido = 'mesa' AND endereco_entrega IS NULL)
        )
      `);
      console.log('✅ Constraint check_tipo_pedido_endereco adicionada');
    } catch (error) {
      if (error.code === '42710') { // duplicate object
        console.log('ℹ️ Constraint check_tipo_pedido_endereco já existe');
      } else {
        throw error;
      }
    }

    await client.query('COMMIT');
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
    // Verificar estrutura final
    console.log('\n📊 Verificando estrutura final da tabela...');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'pedidos'
      AND column_name IN ('tipo_pedido', 'numero_mesa', 'endereco_entrega')
      ORDER BY column_name;
    `);
    
    console.log('\nColunas adicionadas:');
    finalColumns.rows.forEach(col => {
      console.log(`✅ ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'NULL'})`);
    });
    
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar migração:', error);
    console.error('Detalhes:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

fixPedidosTable();