const db = require('../config/database');

const addMultipleFlavorsSupport = async () => {
  try {
    console.log('🚀 Adicionando suporte a múltiplos sabores...');

    // Verificar se a coluna já existe
    const columnExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'itens_pedido' 
        AND column_name = 'sabores_registrados'
    `);

    if (columnExists.rows.length > 0) {
      console.log('ℹ️ Coluna sabores_registrados já existe');
      return;
    }

    // Adicionar coluna sabores_registrados
    await db.query(`
      ALTER TABLE itens_pedido 
      ADD COLUMN sabores_registrados JSONB
    `);
    
    // Adicionar comentário explicativo
    await db.query(`
      COMMENT ON COLUMN itens_pedido.sabores_registrados IS 
      'JSONB array para múltiplos sabores. Estrutura: [{"nome": "Calabresa", "produto_id": "uuid", "percentual": 50}]'
    `);

    console.log('✅ Coluna sabores_registrados adicionada com sucesso');
    console.log('📋 Estrutura esperada:');
    console.log('   - Para 2 sabores: [{"nome": "Calabresa", "produto_id": "uuid", "percentual": 50}, {"nome": "Mussarela", "produto_id": "uuid", "percentual": 50}]');
    console.log('   - Para 3 sabores: [{"nome": "Calabresa", "produto_id": "uuid", "percentual": 33}, {"nome": "Mussarela", "produto_id": "uuid", "percentual": 33}, {"nome": "Portuguesa", "produto_id": "uuid", "percentual": 34}]');
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await addMultipleFlavorsSupport();
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { addMultipleFlavorsSupport };