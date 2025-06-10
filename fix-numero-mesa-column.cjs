require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addNumeroMesaColumn() {
  try {
    console.log('🔧 Adicionando coluna numero_mesa na tabela pedidos...\n');
    
    // Verificar se a coluna já existe
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'numero_mesa';
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna numero_mesa já existe!');
      return;
    }
    
    // Adicionar a coluna numero_mesa
    const addColumnQuery = `
      ALTER TABLE pedidos 
      ADD COLUMN numero_mesa INTEGER DEFAULT NULL;
    `;
    
    await pool.query(addColumnQuery);
    console.log('✅ Coluna numero_mesa adicionada com sucesso!');
    
    // Verificar resultado
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name IN ('tipo_pedido', 'numero_mesa')
      ORDER BY column_name;
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    console.log('\n📋 Colunas adicionadas recentemente:');
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default || ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    pool.end();
  }
}

addNumeroMesaColumn(); 