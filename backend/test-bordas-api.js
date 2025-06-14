const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

// Testar rota de bordas
async function testBordasAPI() {
  console.log('🔍 Testando API de bordas...\n');
  
  try {
    // Fazer requisição para a API
    const response = await fetch('http://localhost:3001/api/bordas');
    
    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API funcionando! Bordas retornadas: ${data.bordas?.length || 0}`);
      
      if (data.bordas && data.bordas.length > 0) {
        console.log('\n📋 Bordas disponíveis:');
        data.bordas.forEach(borda => {
          console.log(`   • ${borda.nome}: R$ ${borda.preco_adicional}`);
        });
      }
    } else {
      const errorData = await response.text();
      console.log(`❌ Erro na API: ${errorData}`);
      
      // Tentar buscar diretamente do banco
      console.log('\n🔄 Buscando bordas diretamente do banco...');
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT id, nome, preco_adicional
          FROM bordas
          WHERE disponivel = true
          ORDER BY nome
        `);
        
        console.log(`\n✅ Bordas no banco: ${result.rows.length}`);
        result.rows.forEach(borda => {
          console.log(`   • ${borda.nome}: R$ ${borda.preco_adicional}`);
        });
        
        console.log('\n⚠️  As bordas existem no banco mas a API não está funcionando.');
        console.log('💡 Possíveis causas:');
        console.log('   1. O servidor backend não está rodando');
        console.log('   2. A rota /api/bordas não está registrada corretamente');
        console.log('   3. Há um erro no arquivo routes/bordas.js');
        
      } finally {
        client.release();
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  O servidor backend não está rodando!');
      console.log('💡 Execute: cd backend && npm run dev');
    }
  } finally {
    await pool.end();
  }
}

testBordasAPI();