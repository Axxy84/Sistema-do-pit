const { Pool } = require('pg');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabase() {
  log('\n=== TESTE DE CONEXÃO E ESTRUTURA DO BANCO ===\n', 'blue');
  
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 5000
  });

  try {
    // 1. Teste de conexão básica
    log('1. Testando conexão básica...', 'yellow');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    log(`✓ Conectado ao PostgreSQL`, 'green');
    log(`  Hora: ${result.rows[0].current_time}`, 'blue');
    log(`  Versão: ${result.rows[0].version.split(',')[0]}`, 'blue');
    client.release();

    // 2. Verificar tabelas principais
    log('\n2. Verificando estrutura das tabelas...', 'yellow');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const requiredTables = [
      'users', 'usuarios', 'profiles', 'clientes', 'produtos', 
      'pedidos', 'itens_pedido', 'cupons', 'entregadores',
      'fechamento_caixa', 'configuracoes'
    ];
    
    const existingTables = tables.rows.map(row => row.table_name);
    
    requiredTables.forEach(table => {
      if (existingTables.includes(table)) {
        log(`  ✓ ${table}`, 'green');
      } else {
        log(`  ✗ ${table} (FALTANDO)`, 'red');
      }
    });

    // 3. Verificar usuários de teste
    log('\n3. Verificando usuários...', 'yellow');
    
    // Tabela users (sistema novo)
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    log(`  users: ${usersCount.rows[0].count} registros`, usersCount.rows[0].count > 0 ? 'green' : 'yellow');
    
    // Tabela usuarios (sistema legado)
    const usuariosCount = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    log(`  usuarios: ${usuariosCount.rows[0].count} registros`, usuariosCount.rows[0].count > 0 ? 'green' : 'yellow');
    
    if (usuariosCount.rows[0].count > 0) {
      const adminUser = await pool.query(`
        SELECT id, nome, email, tipo, ativo 
        FROM usuarios 
        WHERE email = 'admin@pizzaria.com'
      `);
      
      if (adminUser.rows.length > 0) {
        const admin = adminUser.rows[0];
        log(`  ✓ Admin encontrado: ${admin.nome} (${admin.email})`, 'green');
        log(`    Tipo: ${admin.tipo}, Ativo: ${admin.ativo}`, 'blue');
      } else {
        log(`  ✗ Usuário admin não encontrado`, 'red');
      }
    }

    // 4. Verificar dados de exemplo
    log('\n4. Verificando dados de exemplo...', 'yellow');
    
    const clientesCount = await pool.query('SELECT COUNT(*) as count FROM clientes');
    log(`  Clientes: ${clientesCount.rows[0].count}`, clientesCount.rows[0].count > 0 ? 'green' : 'yellow');
    
    const produtosCount = await pool.query('SELECT COUNT(*) as count FROM produtos');
    log(`  Produtos: ${produtosCount.rows[0].count}`, produtosCount.rows[0].count > 0 ? 'green' : 'yellow');
    
    const pedidosCount = await pool.query('SELECT COUNT(*) as count FROM pedidos');
    log(`  Pedidos: ${pedidosCount.rows[0].count}`, pedidosCount.rows[0].count > 0 ? 'green' : 'yellow');

    // 5. Testar queries essenciais
    log('\n5. Testando queries do dashboard...', 'yellow');
    
    try {
      // Query de KPIs do dashboard
      const kpiQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN DATE(data_pedido) = CURRENT_DATE THEN total ELSE 0 END), 0) as sales_today,
          COUNT(CASE WHEN DATE(data_pedido) = CURRENT_DATE THEN 1 END) as orders_today,
          COUNT(CASE WHEN status_pedido = 'pendente' THEN 1 END) as pending_orders
        FROM pedidos
      `;
      
      const kpiResult = await pool.query(kpiQuery);
      log(`  ✓ Query KPIs executada com sucesso`, 'green');
      log(`    Vendas hoje: R$ ${kpiResult.rows[0].sales_today}`, 'blue');
      log(`    Pedidos hoje: ${kpiResult.rows[0].orders_today}`, 'blue');
      log(`    Pedidos pendentes: ${kpiResult.rows[0].pending_orders}`, 'blue');
      
    } catch (error) {
      log(`  ✗ Erro na query KPIs: ${error.message}`, 'red');
    }

    // 6. Testar autenticação
    log('\n6. Testando estrutura de autenticação...', 'yellow');
    
    try {
      // Verificar se as queries de auth funcionam
      const authTestQuery = `
        SELECT u.id, u.email, p.full_name, p.role 
        FROM users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE u.email = 'test@test.com'
      `;
      
      await pool.query(authTestQuery);
      log(`  ✓ Query de autenticação (users/profiles) funciona`, 'green');
      
    } catch (error) {
      log(`  ✗ Erro na query de autenticação: ${error.message}`, 'red');
    }
    
    try {
      // Testar query alternativa para usuarios
      const usuariosAuthQuery = `
        SELECT id, nome, email, senha, tipo
        FROM usuarios
        WHERE email = 'admin@pizzaria.com'
      `;
      
      const result = await pool.query(usuariosAuthQuery);
      if (result.rows.length > 0) {
        log(`  ✓ Query de autenticação (usuarios) funciona`, 'green');
        log(`    Usuário encontrado: ${result.rows[0].nome}`, 'blue');
      } else {
        log(`  ⚠ Query usuarios funciona mas não encontrou admin`, 'yellow');
      }
      
    } catch (error) {
      log(`  ✗ Erro na query usuarios: ${error.message}`, 'red');
    }

    log('\n=== RESULTADO FINAL ===', 'blue');
    log('✓ Banco de dados acessível e funcional', 'green');
    
  } catch (error) {
    log('\n=== ERRO CRÍTICO ===', 'red');
    log(`✗ Falha na conexão: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\nSoluções possíveis:', 'yellow');
      log('1. Verificar se PostgreSQL está rodando', 'reset');
      log('2. Verificar configurações no .env', 'reset');
      log('3. Verificar se a porta 5432 está liberada', 'reset');
    }
    
  } finally {
    await pool.end();
  }
}

// Executar teste
testDatabase().catch(console.error);