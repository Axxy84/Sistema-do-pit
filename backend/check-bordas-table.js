const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function checkBordasTable() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Verificando se a tabela "bordas" existe...\n');
    
    // Verificar se a tabela existe
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bordas'
      );
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Tabela "bordas" existe!\n');
      
      // Verificar estrutura da tabela
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'bordas'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Estrutura da tabela "bordas":');
      structureResult.rows.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
      
      // Contar registros
      const countResult = await client.query('SELECT COUNT(*) FROM bordas');
      console.log(`\n📊 Total de bordas cadastradas: ${countResult.rows[0].count}`);
      
      // Listar bordas disponíveis
      const bordasResult = await client.query(`
        SELECT id, nome, preco_adicional, disponivel
        FROM bordas
        ORDER BY nome
      `);
      
      if (bordasResult.rows.length > 0) {
        console.log('\n📋 Bordas cadastradas:');
        bordasResult.rows.forEach(borda => {
          console.log(`   • ${borda.nome}: R$ ${borda.preco_adicional} (${borda.disponivel ? 'Disponível' : 'Indisponível'})`);
        });
      }
      
    } else {
      console.log('❌ Tabela "bordas" NÃO existe!\n');
      console.log('⚠️  O sistema está tentando buscar bordas de uma tabela que não existe.');
      console.log('💡 Isso explica por que as bordas não aparecem no formulário de pedidos.');
      
      console.log('\n📝 SQL para criar a tabela:');
      console.log(`
CREATE TABLE IF NOT EXISTS bordas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  preco_adicional DECIMAL(10,2) NOT NULL DEFAULT 0,
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir algumas bordas de exemplo
INSERT INTO bordas (nome, preco_adicional) VALUES 
  ('Catupiry', 5.00),
  ('Cheddar', 6.00),
  ('Cream Cheese', 7.00),
  ('Chocolate', 8.00);
      `);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela de bordas:', error.message);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
}

checkBordasTable();