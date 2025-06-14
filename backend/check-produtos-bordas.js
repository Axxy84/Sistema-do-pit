require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function checkBordasProdutos() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Verificando produtos do tipo "borda" na tabela produtos...\n');
    
    const result = await client.query(`
      SELECT id, nome, tipo_produto, preco_unitario, ativo
      FROM produtos
      WHERE tipo_produto = 'borda'
      ORDER BY nome
    `);
    
    console.log(`📋 Encontrados ${result.rows.length} produtos do tipo borda:`);
    result.rows.forEach(produto => {
      console.log(`   • ${produto.nome}: R$ ${produto.preco_unitario || '0.00'} (${produto.ativo ? 'Ativo' : 'Inativo'})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar produtos:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

checkBordasProdutos(); 