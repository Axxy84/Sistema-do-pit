const db = require('../config/database');

const addMissingColumns = async () => {
  try {
    console.log('🔧 Adicionando colunas faltantes na tabela pedidos...');

    // Verificar e adicionar valor_pago
    const valorPagoExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'valor_pago'
    `);
    
    if (valorPagoExists.rows.length === 0) {
      await db.query('ALTER TABLE pedidos ADD COLUMN valor_pago DECIMAL(10,2)');
      console.log('✅ Coluna valor_pago adicionada');
    } else {
      console.log('ℹ️ Coluna valor_pago já existe');
    }

    // Verificar e adicionar troco_calculado
    const trocoExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'troco_calculado'
    `);
    
    if (trocoExists.rows.length === 0) {
      await db.query('ALTER TABLE pedidos ADD COLUMN troco_calculado DECIMAL(10,2)');
      console.log('✅ Coluna troco_calculado adicionada');
    } else {
      console.log('ℹ️ Coluna troco_calculado já existe');
    }

    // Verificar e adicionar updated_at
    const updatedAtExists = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'updated_at'
    `);
    
    if (updatedAtExists.rows.length === 0) {
      await db.query('ALTER TABLE pedidos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log('✅ Coluna updated_at adicionada');
    } else {
      console.log('ℹ️ Coluna updated_at já existe');
    }

    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await addMissingColumns();
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { addMissingColumns };