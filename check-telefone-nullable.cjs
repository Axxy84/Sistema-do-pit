const db = require('./backend/config/database');

async function checkTelefoneColumn() {
  try {
    // Verificar estrutura da coluna telefone
    const result = await db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'clientes'
      AND column_name = 'telefone'
    `);

    console.log('Estrutura da coluna telefone:', result.rows[0]);

    // Se não permite NULL, alterar
    if (result.rows[0]?.is_nullable === 'NO') {
      console.log('Coluna telefone não permite NULL. Alterando...');
      
      await db.query(`
        ALTER TABLE clientes 
        ALTER COLUMN telefone DROP NOT NULL
      `);
      
      console.log('✅ Coluna telefone agora permite valores NULL');
    } else {
      console.log('✅ Coluna telefone já permite valores NULL');
    }

    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkTelefoneColumn();