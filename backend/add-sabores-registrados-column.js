const db = require('./config/database');

async function addSaboresRegistradosColumn() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔧 Adicionando coluna sabores_registrados...');
    
    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'itens_pedido' 
      AND column_name = 'sabores_registrados'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Coluna sabores_registrados já existe!');
      return;
    }
    
    // Adicionar a coluna
    await client.query(`
      ALTER TABLE itens_pedido 
      ADD COLUMN sabores_registrados JSONB
    `);
    
    console.log('✅ Coluna sabores_registrados adicionada com sucesso!');
    
    // Verificar a estrutura atualizada
    const updatedStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'itens_pedido' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura atualizada da tabela itens_pedido:');
    updatedStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

addSaboresRegistradosColumn();