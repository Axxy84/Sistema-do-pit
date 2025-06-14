// Teste direto da query problemática
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pizzaria_db',
  user: 'postgres',
  password: '8477'
});

async function testQuery() {
  console.log('🔍 Testando query de mesas...\n');
  
  try {
    // Conectar ao banco
    const client = await pool.connect();
    
    // Query original que está dando erro
    console.log('1️⃣ Query original (com erro):');
    try {
      const result = await client.query(`
        SELECT 
          p.numero_mesa,
          p.status_pedido,
          COUNT(*) as total_pedidos,
          SUM(p.total) as valor_total,
          MIN(p.created_at) as abertura,
          MAX(p.updated_at) as ultima_atividade,
          MAX(CASE WHEN p.cliente_id IS NOT NULL THEN 1 ELSE 0 END) as tem_cliente,
          STRING_AGG(DISTINCT c.nome, ', ') as nomes_clientes
        FROM pedidos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.tipo_pedido = 'mesa'
          AND p.numero_mesa IS NOT NULL
          AND p.status_pedido NOT IN ('entregue', 'retirado', 'cancelado')
        GROUP BY p.numero_mesa, p.status_pedido
        ORDER BY p.numero_mesa
      `);
      console.log('✅ Query executada com sucesso!');
      console.log(`   Encontradas ${result.rows.length} mesas abertas`);
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    
    // Verificar estrutura das tabelas
    console.log('\n2️⃣ Verificando colunas da tabela pedidos:');
    const pedidosColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
      ORDER BY ordinal_position
    `);
    console.log('   Colunas:', pedidosColumns.rows.map(r => r.column_name).join(', '));
    
    console.log('\n3️⃣ Verificando colunas da tabela clientes:');
    const clientesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY ordinal_position
    `);
    console.log('   Colunas:', clientesColumns.rows.map(r => r.column_name).join(', '));
    
    // Verificar se ambas têm created_at
    console.log('\n4️⃣ Verificando conflito de colunas:');
    const pedidosHasCreatedAt = pedidosColumns.rows.some(r => r.column_name === 'created_at');
    const clientesHasCreatedAt = clientesColumns.rows.some(r => r.column_name === 'created_at');
    console.log(`   pedidos.created_at: ${pedidosHasCreatedAt ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   clientes.created_at: ${clientesHasCreatedAt ? '✅ SIM' : '❌ NÃO'}`);
    
    if (pedidosHasCreatedAt && clientesHasCreatedAt) {
      console.log('   ⚠️  Ambas as tabelas têm created_at - pode causar ambiguidade!');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testQuery();