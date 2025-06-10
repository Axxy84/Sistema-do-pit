require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addTipoPedidoColumn() {
  try {
    console.log('🔧 Adicionando coluna tipo_pedido na tabela pedidos...\n');
    
    // Verificar se a coluna já existe
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'tipo_pedido';
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna tipo_pedido já existe!');
      return;
    }
    
    // Adicionar a coluna tipo_pedido
    const addColumnQuery = `
      ALTER TABLE pedidos 
      ADD COLUMN tipo_pedido VARCHAR(50) DEFAULT 'balcao';
    `;
    
    await pool.query(addColumnQuery);
    console.log('✅ Coluna tipo_pedido adicionada com sucesso!');
    
    // Atualizar pedidos existentes baseado em alguma lógica
    const updateQuery = `
      UPDATE pedidos 
      SET tipo_pedido = CASE 
        WHEN entregador_nome IS NOT NULL THEN 'delivery'
        ELSE 'balcao'
      END;
    `;
    
    const updateResult = await pool.query(updateQuery);
    console.log(`✅ ${updateResult.rowCount} pedidos atualizados com tipo_pedido`);
    
    // Verificar resultado
    const verifyQuery = `
      SELECT tipo_pedido, COUNT(*) as count 
      FROM pedidos 
      GROUP BY tipo_pedido;
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    console.log('\n📊 Distribuição dos tipos de pedido:');
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.tipo_pedido}: ${row.count} pedidos`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    pool.end();
  }
}

addTipoPedidoColumn(); 