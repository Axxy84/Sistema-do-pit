const db = require('./config/database');

async function checkConstraints() {
  try {
    console.log('🔍 Verificando constraints da tabela produtos...');
    
    // Buscar constraints
    const constraints = await db.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'produtos'
    `);
    
    console.log('\n📋 Constraints encontradas:');
    constraints.rows.forEach(constraint => {
      console.log(`- ${constraint.constraint_name}:`);
      console.log(`  ${constraint.constraint_definition}\n`);
    });
    
    // Verificar tipos permitidos
    const typeCheck = constraints.rows.find(c => c.constraint_name.includes('tipo_produto'));
    if (typeCheck) {
      console.log('🔍 Constraint de tipo_produto detectada!');
      console.log('📝 Definição:', typeCheck.constraint_definition);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkConstraints(); 