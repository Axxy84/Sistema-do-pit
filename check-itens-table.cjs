const { Pool } = require('pg');

const pool = new Pool({
  user: 'thiago',
  host: '192.168.0.105',
  database: 'pizzaria_db',
  password: 'senha123',
  port: 5432,
});

async function checkItensTable() {
  try {
    console.log('📋 ESTRUTURA DA TABELA itens_pedido:');
    console.log('===================================');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'itens_pedido'
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`• ${row.column_name.padEnd(20)} | ${row.data_type.padEnd(15)} | nullable: ${row.is_nullable}`);
    });
    
    console.log('\n🔍 PROCURANDO CAMPOS PROBLEMÁTICOS:');
    result.rows.forEach(row => {
      if (row.data_type === 'uuid') {
        console.log(`🚨 Campo UUID: ${row.column_name} (nullable: ${row.is_nullable})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkItensTable(); 