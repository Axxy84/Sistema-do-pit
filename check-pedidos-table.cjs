require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkPedidosTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela pedidos...\n');
    
    // Verificar colunas da tabela pedidos
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(columnsQuery);
    
    console.log('📋 Colunas encontradas na tabela pedidos:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Verificar se tipo_pedido existe
    const hasTipoPedido = result.rows.some(row => row.column_name === 'tipo_pedido');
    
    console.log(`\n🔍 Coluna tipo_pedido existe: ${hasTipoPedido ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!hasTipoPedido) {
      console.log('\n🛠️ Precisa adicionar a coluna tipo_pedido');
      console.log('💡 Sugestão de comando SQL:');
      console.log('ALTER TABLE pedidos ADD COLUMN tipo_pedido VARCHAR(50) DEFAULT \'balcao\';');
    }
    
    // Verificar algumas entradas para entender o contexto
    console.log('\n📊 Verificando alguns pedidos existentes:');
    const pedidosQuery = 'SELECT id, status, created_at FROM pedidos LIMIT 5';
    const pedidosResult = await pool.query(pedidosQuery);
    
    if (pedidosResult.rows.length > 0) {
      pedidosResult.rows.forEach(pedido => {
        console.log(`   - ID: ${pedido.id}, Status: ${pedido.status}, Criado: ${pedido.created_at}`);
      });
    } else {
      console.log('   - Nenhum pedido encontrado na tabela');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    pool.end();
  }
}

checkPedidosTable(); 