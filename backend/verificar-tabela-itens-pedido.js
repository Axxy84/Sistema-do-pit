/**
 * Script para verificar a estrutura da tabela itens_pedido
 */

const db = require('./config/database');

async function verificarTabelaItensPedido() {
  try {
    console.log('Verificando estrutura da tabela itens_pedido...');
    
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'itens_pedido'
      ORDER BY ordinal_position
    `);
    
    console.log('\nEstrutura da tabela itens_pedido:');
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
verificarTabelaItensPedido(); 