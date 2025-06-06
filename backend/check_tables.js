const db = require('./config/database');

async function checkTables() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...');
    
    const produtos = await db.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'produtos\'');
    console.log('\n📦 Tabela produtos:');
    produtos.rows.forEach(row => console.log(`  ${row.column_name} - ${row.data_type}`));
    
    const clientes = await db.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'clientes\'');
    console.log('\n👥 Tabela clientes:');
    clientes.rows.forEach(row => console.log(`  ${row.column_name} - ${row.data_type}`));
    
    const pedidos = await db.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'pedidos\'');
    console.log('\n🛒 Tabela pedidos:');
    pedidos.rows.forEach(row => console.log(`  ${row.column_name} - ${row.data_type}`));
    
    const itens = await db.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'itens_pedido\'');
    console.log('\n📋 Tabela itens_pedido:');
    itens.rows.forEach(row => console.log(`  ${row.column_name} - ${row.data_type}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkTables(); 