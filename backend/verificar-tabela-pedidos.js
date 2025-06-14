/**
 * Script para verificar a estrutura da tabela pedidos
 */

const db = require('./config/database');

async function verificarTabelaPedidos() {
  try {
    console.log('Verificando estrutura da tabela pedidos...');
    
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos'
      ORDER BY ordinal_position
    `);
    
    console.log('\nEstrutura da tabela pedidos:');
    console.log('-----------------------------');
    result.rows.forEach(col => {
      console.log(`${col.column_name} (${col.data_type})`);
    });
    
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
  }
}

// Executar a função
verificarTabelaPedidos(); 