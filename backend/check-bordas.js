const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function checkBordas() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Verificando produtos do tipo "borda"...\n');
    
    // Contar produtos por tipo
    const countResult = await client.query(`
      SELECT tipo_produto, COUNT(*) as total 
      FROM produtos 
      GROUP BY tipo_produto 
      ORDER BY tipo_produto
    `);
    
    console.log('📊 Contagem de produtos por tipo:');
    countResult.rows.forEach(row => {
      console.log(`   • ${row.tipo_produto || 'NULL'}: ${row.total} produtos`);
    });
    
    // Buscar produtos do tipo borda
    const bordasResult = await client.query(`
      SELECT id, nome, preco_unitario, ativo, created_at
      FROM produtos 
      WHERE tipo_produto = 'borda'
      ORDER BY nome
    `);
    
    console.log(`\n🥖 Produtos do tipo "borda" encontrados: ${bordasResult.rows.length}`);
    
    if (bordasResult.rows.length > 0) {
      console.log('\n📋 Lista de bordas:');
      bordasResult.rows.forEach(borda => {
        console.log(`   • ${borda.nome}`);
        console.log(`     - ID: ${borda.id}`);
        console.log(`     - Preço: R$ ${borda.preco_unitario || 'N/A'}`);
        console.log(`     - Ativo: ${borda.ativo ? 'Sim' : 'Não'}`);
        console.log(`     - Criado em: ${new Date(borda.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  Nenhuma borda cadastrada no sistema!');
      console.log('\n💡 Sugestão: Adicione bordas recheadas através da interface de produtos.');
    }
    
    // Verificar constraint de tipo_produto
    const constraintResult = await client.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = 'produtos'::regclass 
      AND contype = 'c'
      AND conname LIKE '%tipo_produto%'
    `);
    
    if (constraintResult.rows.length > 0) {
      console.log('\n🔒 Constraint de tipo_produto:');
      constraintResult.rows.forEach(row => {
        console.log(`   ${row.consrc}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar bordas:', error.message);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
}

checkBordas();