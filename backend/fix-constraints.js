const db = require('./config/database');

async function fixConstraints() {
  try {
    console.log('🔧 Atualizando constraint para incluir tipo "borda"...');
    
    // Remover constraint atual
    await db.query('ALTER TABLE produtos DROP CONSTRAINT produtos_tipo_produto_check');
    console.log('✅ Constraint antigo removido');
    
    // Adicionar novo constraint incluindo 'borda'
    await db.query(`
      ALTER TABLE produtos ADD CONSTRAINT produtos_tipo_produto_check 
      CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento', 'borda', 'outros'))
    `);
    console.log('✅ Constraint atualizado com tipo "borda"');
    
    // Verificar
    const verification = await db.query(`
      SELECT pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'produtos' AND c.conname = 'produtos_tipo_produto_check'
    `);
    
    console.log('\n🔍 Novo constraint:');
    console.log(verification.rows[0]?.constraint_definition);
    
    console.log('\n🎉 Constraint atualizado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixConstraints(); 