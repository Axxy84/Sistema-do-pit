const db = require('./config/database');

async function addEstoqueColumn() {
  console.log('\n🔧 Adicionando coluna estoque_disponivel à tabela produtos...\n');
  
  try {
    // Verificar se a coluna já existe
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'estoque_disponivel'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna estoque_disponivel já existe!');
      return;
    }
    
    // Adicionar a coluna
    await db.query('ALTER TABLE produtos ADD COLUMN estoque_disponivel INTEGER');
    console.log('✅ Coluna estoque_disponivel adicionada com sucesso!');
    
    // Verificar se foi adicionada
    const verifyResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'estoque_disponivel'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Coluna verificada: estoque_disponivel (INTEGER)');
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
  } finally {
    process.exit();
  }
}

addEstoqueColumn();