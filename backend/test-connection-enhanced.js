const { Pool } = require('pg');
const net = require('net');
const dns = require('dns').promises;
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testNetworkConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function resolveDNS(host) {
  try {
    const addresses = await dns.resolve4(host);
    return addresses;
  } catch (error) {
    return null;
  }
}

async function testConnection() {
  log('\n========== TESTE DE CONEXÃO POSTGRESQL ==========\n', 'cyan');
  
  // 1. Verificar variáveis de ambiente
  log('1. VERIFICANDO VARIÁVEIS DE AMBIENTE:', 'yellow');
  const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
  };
  
  const envVars = [
    { name: 'DB_USER', value: dbConfig.user },
    { name: 'DB_HOST', value: dbConfig.host },
    { name: 'DB_NAME', value: dbConfig.database },
    { name: 'DB_PASSWORD', value: dbConfig.password ? '***' + dbConfig.password.slice(-3) : undefined },
    { name: 'DB_PORT', value: dbConfig.port }
  ];
  
  let hasEnvError = false;
  envVars.forEach(({ name, value }) => {
    if (value) {
      log(`✓ ${name}: ${value}`, 'green');
    } else {
      log(`✗ ${name}: NÃO DEFINIDA`, 'red');
      hasEnvError = true;
    }
  });
  
  if (hasEnvError) {
    log('\n⚠️  Algumas variáveis de ambiente não estão definidas!', 'red');
    log('Certifique-se de que o arquivo .env existe e contém todas as variáveis necessárias.', 'yellow');
  }
  
  // 2. Testar conectividade de rede
  log('\n2. TESTANDO CONECTIVIDADE DE REDE:', 'yellow');
  
  // Verificar se é IP ou hostname
  const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(dbConfig.host);
  
  if (!isIP) {
    log(`Resolvendo DNS para ${dbConfig.host}...`, 'blue');
    const addresses = await resolveDNS(dbConfig.host);
    if (addresses) {
      log(`✓ DNS resolvido: ${addresses.join(', ')}`, 'green');
    } else {
      log(`✗ Falha ao resolver DNS para ${dbConfig.host}`, 'red');
    }
  }
  
  log(`Testando conexão TCP para ${dbConfig.host}:${dbConfig.port}...`, 'blue');
  const canConnect = await testNetworkConnection(dbConfig.host, dbConfig.port);
  
  if (canConnect) {
    log(`✓ Porta ${dbConfig.port} está acessível em ${dbConfig.host}`, 'green');
  } else {
    log(`✗ Não foi possível conectar em ${dbConfig.host}:${dbConfig.port}`, 'red');
    log('\nPossíveis causas:', 'yellow');
    log('- PostgreSQL não está rodando', 'reset');
    log('- Firewall bloqueando a conexão', 'reset');
    log('- Host/porta incorretos', 'reset');
    log('- PostgreSQL não está configurado para aceitar conexões remotas', 'reset');
  }
  
  // 3. Tentar conexão com PostgreSQL
  log('\n3. TENTANDO CONEXÃO COM POSTGRESQL:', 'yellow');
  
  const pool = new Pool(dbConfig);
  
  try {
    log('Conectando ao banco de dados...', 'blue');
    const client = await pool.connect();
    
    log('✓ Conexão estabelecida com sucesso!', 'green');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    log(`\n✓ Query executada com sucesso:`, 'green');
    log(`  Hora no servidor: ${result.rows[0].current_time}`, 'cyan');
    log(`  Versão PostgreSQL: ${result.rows[0].pg_version.split(',')[0]}`, 'cyan');
    
    // Verificar permissões no banco
    const dbCheck = await client.query(`
      SELECT current_database() as database,
             current_user as user,
             pg_database_size(current_database()) as size
    `);
    
    log(`\n✓ Informações do banco:`, 'green');
    log(`  Database: ${dbCheck.rows[0].database}`, 'cyan');
    log(`  Usuário: ${dbCheck.rows[0].user}`, 'cyan');
    log(`  Tamanho: ${(dbCheck.rows[0].size / 1024 / 1024).toFixed(2)} MB`, 'cyan');
    
    client.release();
    
  } catch (error) {
    log('\n✗ ERRO ao conectar com PostgreSQL:', 'red');
    log(`  Código: ${error.code}`, 'red');
    log(`  Mensagem: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n⚠️  Conexão recusada. Possíveis soluções:', 'yellow');
      log('1. Verifique se o PostgreSQL está rodando no servidor', 'reset');
      log('2. Verifique se o PostgreSQL está escutando no IP correto', 'reset');
      log('   (postgresql.conf: listen_addresses)', 'reset');
      log('3. Verifique as regras de firewall', 'reset');
    } else if (error.code === '28P01') {
      log('\n⚠️  Falha de autenticação. Possíveis soluções:', 'yellow');
      log('1. Verifique o usuário e senha', 'reset');
      log('2. Verifique pg_hba.conf no servidor PostgreSQL', 'reset');
      log('3. Certifique-se que o usuário tem permissão para o banco', 'reset');
    } else if (error.code === '3D000') {
      log('\n⚠️  Banco de dados não existe. Execute:', 'yellow');
      log(`CREATE DATABASE ${dbConfig.database};`, 'cyan');
    } else if (error.code === 'ENOTFOUND') {
      log('\n⚠️  Host não encontrado. Verifique:', 'yellow');
      log('1. O endereço do host está correto', 'reset');
      log('2. O servidor está acessível na rede', 'reset');
    }
    
    if (error.stack) {
      log('\nStack trace completo:', 'yellow');
      console.error(error.stack);
    }
  } finally {
    await pool.end();
  }
  
  log('\n========== FIM DO TESTE ==========\n', 'cyan');
}

// Executar teste
testConnection().catch(console.error);