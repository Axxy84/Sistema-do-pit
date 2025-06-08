const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironmentVariables() {
  log('\n=== VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE ===\n', 'cyan');
  
  const requiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
  const optionalVars = ['DB_PORT'];
  const missingVars = [];
  const configSummary = {};
  
  // Verificar arquivo .env
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('⚠️  Arquivo .env não encontrado!', 'red');
    log(`   Procurando em: ${envPath}`, 'gray');
    log('   Crie um arquivo .env com as configurações do banco de dados', 'yellow');
    return null;
  }
  
  log('✓ Arquivo .env encontrado', 'green');
  log(`  Localização: ${envPath}`, 'gray');
  
  // Validar variáveis obrigatórias
  log('\n📋 Variáveis obrigatórias:', 'blue');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
      log(`  ✗ ${varName}: NÃO DEFINIDA`, 'red');
    } else {
      if (varName === 'DB_PASSWORD') {
        const maskedValue = value.length > 3 ? '***' + value.slice(-3) : '***';
        log(`  ✓ ${varName}: ${maskedValue}`, 'green');
        configSummary[varName] = value;
      } else {
        log(`  ✓ ${varName}: ${value}`, 'green');
        configSummary[varName] = value;
      }
    }
  });
  
  // Validar variáveis opcionais
  log('\n📋 Variáveis opcionais:', 'blue');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value.trim() !== '') {
      log(`  ✓ ${varName}: ${value}`, 'green');
      configSummary[varName] = value;
    } else {
      const defaultValue = varName === 'DB_PORT' ? '5432' : 'padrão';
      log(`  ○ ${varName}: não definida (usando ${defaultValue})`, 'gray');
      if (varName === 'DB_PORT') {
        configSummary[varName] = '5432';
      }
    }
  });
  
  if (missingVars.length > 0) {
    log('\n❌ ERRO: Variáveis obrigatórias não definidas!', 'red');
    log('\nAdicione as seguintes variáveis ao seu arquivo .env:', 'yellow');
    missingVars.forEach(varName => {
      log(`${varName}=seu_valor_aqui`, 'cyan');
    });
    
    log('\nExemplo de arquivo .env:', 'yellow');
    log('DB_HOST=localhost', 'gray');
    log('DB_PORT=5432', 'gray');
    log('DB_USER=seu_usuario', 'gray');
    log('DB_PASSWORD=sua_senha', 'gray');
    log('DB_NAME=nome_do_banco', 'gray');
    
    return null;
  }
  
  return configSummary;
}

async function testDatabaseConnection(config) {
  log('\n=== TESTE DE CONEXÃO COM POSTGRESQL ===\n', 'cyan');
  
  const pool = new Pool({
    user: config.DB_USER,
    host: config.DB_HOST,
    database: config.DB_NAME,
    password: config.DB_PASSWORD,
    port: config.DB_PORT || 5432,
    connectionTimeoutMillis: 5000,
    max: 1
  });
  
  try {
    log('🔄 Tentando conectar ao banco de dados...', 'blue');
    log(`   Host: ${config.DB_HOST}:${config.DB_PORT || 5432}`, 'gray');
    log(`   Banco: ${config.DB_NAME}`, 'gray');
    log(`   Usuário: ${config.DB_USER}`, 'gray');
    
    const client = await pool.connect();
    
    log('\n✅ CONEXÃO ESTABELECIDA COM SUCESSO!', 'green');
    
    // Obter informações do banco
    const versionResult = await client.query('SELECT version()');
    const currentUserResult = await client.query('SELECT current_user');
    const currentDbResult = await client.query('SELECT current_database()');
    
    log('\n📊 Informações da conexão:', 'blue');
    log(`   PostgreSQL: ${versionResult.rows[0].version.split(' ')[1]}`, 'cyan');
    log(`   Usuário conectado: ${currentUserResult.rows[0].current_user}`, 'cyan');
    log(`   Banco de dados: ${currentDbResult.rows[0].current_database}`, 'cyan');
    
    client.release();
    await pool.end();
    
    log('\n✓ Teste concluído com sucesso!', 'green');
    return true;
    
  } catch (error) {
    log('\n❌ FALHA NA CONEXÃO!', 'red');
    
    // Análise detalhada do erro
    if (error.code === '28P01' || error.message.includes('password authentication failed')) {
      log('\n🔐 Erro de autenticação:', 'yellow');
      log(`   Usuário: ${config.DB_USER}`, 'red');
      log('   Senha: ***' + (config.DB_PASSWORD.slice(-3) || ''), 'red');
      
      log('\n💡 Possíveis soluções:', 'yellow');
      log('   1. Verifique se a senha está correta no arquivo .env', 'gray');
      log('   2. Confirme se o usuário existe no PostgreSQL:', 'gray');
      log(`      sudo -u postgres psql -c "\\du"`, 'cyan');
      log('   3. Verifique as permissões do usuário no banco:', 'gray');
      log(`      GRANT ALL PRIVILEGES ON DATABASE ${config.DB_NAME} TO ${config.DB_USER};`, 'cyan');
      log('   4. Verifique o arquivo pg_hba.conf no servidor PostgreSQL', 'gray');
      
    } else if (error.code === 'ECONNREFUSED') {
      log('\n🔌 Conexão recusada:', 'yellow');
      log(`   Não foi possível conectar em ${config.DB_HOST}:${config.DB_PORT || 5432}`, 'red');
      
      log('\n💡 Possíveis soluções:', 'yellow');
      log('   1. Verifique se o PostgreSQL está rodando:', 'gray');
      log('      sudo systemctl status postgresql', 'cyan');
      log('   2. Verifique se está escutando no IP correto:', 'gray');
      log('      No postgresql.conf, procure por listen_addresses', 'cyan');
      log('   3. Verifique o firewall:', 'gray');
      log(`      sudo ufw allow ${config.DB_PORT || 5432}/tcp`, 'cyan');
      
    } else if (error.code === '3D000') {
      log('\n🗄️ Banco de dados não existe:', 'yellow');
      log(`   O banco "${config.DB_NAME}" não foi encontrado`, 'red');
      
      log('\n💡 Para criar o banco:', 'yellow');
      log('   sudo -u postgres psql', 'cyan');
      log(`   CREATE DATABASE ${config.DB_NAME};`, 'cyan');
      log(`   GRANT ALL PRIVILEGES ON DATABASE ${config.DB_NAME} TO ${config.DB_USER};`, 'cyan');
      
    } else if (error.code === 'ENOTFOUND') {
      log('\n🌐 Host não encontrado:', 'yellow');
      log(`   Não foi possível resolver o endereço: ${config.DB_HOST}`, 'red');
      
      log('\n💡 Possíveis soluções:', 'yellow');
      log('   1. Verifique se o endereço está correto', 'gray');
      log('   2. Tente usar o IP ao invés do hostname', 'gray');
      log('   3. Verifique sua conexão de rede', 'gray');
      
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      log('\n⏱️ Timeout na conexão:', 'yellow');
      log('   A conexão demorou muito tempo para responder', 'red');
      
      log('\n💡 Possíveis soluções:', 'yellow');
      log('   1. Verifique se o servidor está acessível na rede', 'gray');
      log('   2. Verifique se há um firewall bloqueando', 'gray');
      log('   3. O servidor pode estar sobrecarregado', 'gray');
      
    } else {
      log('\n⚠️ Erro desconhecido:', 'yellow');
      log(`   Código: ${error.code || 'N/A'}`, 'red');
      log(`   Mensagem: ${error.message}`, 'red');
    }
    
    log('\n📄 Configuração atual do .env:', 'blue');
    log(`   DB_HOST=${config.DB_HOST}`, 'gray');
    log(`   DB_PORT=${config.DB_PORT || 5432}`, 'gray');
    log(`   DB_USER=${config.DB_USER}`, 'gray');
    log(`   DB_PASSWORD=***${config.DB_PASSWORD.slice(-3) || ''}`, 'gray');
    log(`   DB_NAME=${config.DB_NAME}`, 'gray');
    
    await pool.end();
    return false;
  }
}

// Função principal para exportar
async function validateAndConnect() {
  try {
    const config = validateEnvironmentVariables();
    
    if (!config) {
      process.exit(1);
    }
    
    const success = await testDatabaseConnection(config);
    
    if (!success) {
      process.exit(1);
    }
    
    return config;
  } catch (error) {
    log('\n❌ Erro inesperado:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Se executado diretamente
if (require.main === module) {
  validateAndConnect();
}

module.exports = { validateAndConnect, validateEnvironmentVariables };