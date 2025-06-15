const db = require('./config/database');

async function checkProdutosColumns() {
  console.log('\n🔍 Verificando colunas da tabela produtos...\n');
  
  try {
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'produtos'
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas encontradas:');
    console.log('='.repeat(50));
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar especificamente a coluna ingredientes
    const hasIngredientes = result.rows.some(col => col.column_name === 'ingredientes');
    
    if (!hasIngredientes) {
      console.log('\n❌ Coluna "ingredientes" NÃO ENCONTRADA!');
      console.log('\n💡 Sugestão: Adicionar coluna com:');
      console.log('ALTER TABLE produtos ADD COLUMN ingredientes TEXT;');
    } else {
      console.log('\n✅ Coluna "ingredientes" existe!');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    process.exit();
  }
}

checkProdutosColumns();