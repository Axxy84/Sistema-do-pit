const db = require('./config/database');

async function checkData() {
  try {
    console.log('🔍 Verificando dados no banco...');
    
    const pedidos = await db.query('SELECT COUNT(*) FROM pedidos');
    console.log('📦 Pedidos:', pedidos.rows[0].count);
    
    const clientes = await db.query('SELECT COUNT(*) FROM clientes');
    console.log('👥 Clientes:', clientes.rows[0].count);
    
    const produtos = await db.query('SELECT COUNT(*) FROM produtos');
    console.log('🍕 Produtos:', produtos.rows[0].count);
    
    const ingredientes = await db.query('SELECT COUNT(*) FROM ingredientes');
    console.log('🥬 Ingredientes:', ingredientes.rows[0].count);
    
    // Verificar pedidos de hoje
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const pedidosHoje = await db.query('SELECT COUNT(*) FROM pedidos WHERE data_pedido >= $1 AND data_pedido <= $2', [todayStart, todayEnd]);
    console.log('📅 Pedidos hoje:', pedidosHoje.rows[0].count);
    
    const vendasHoje = await db.query('SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE status_pedido = \'entregue\' AND data_pedido >= $1 AND data_pedido <= $2', [todayStart, todayEnd]);
    console.log('💰 Vendas hoje:', vendasHoje.rows[0].total);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkData(); 