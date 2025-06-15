const db = require('./config/database');

async function addIngredientesColumn() {
  console.log('\n🔧 Adicionando coluna ingredientes à tabela produtos...\n');
  
  try {
    // Verificar se a coluna já existe
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'ingredientes'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna ingredientes já existe!');
      return;
    }
    
    // Adicionar a coluna
    await db.query('ALTER TABLE produtos ADD COLUMN ingredientes TEXT');
    console.log('✅ Coluna ingredientes adicionada com sucesso!');
    
    // Verificar se foi adicionada
    const verifyResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'ingredientes'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Coluna verificada: ingredientes (TEXT)');
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
  } finally {
    process.exit();
  }
}

addIngredientesColumn();