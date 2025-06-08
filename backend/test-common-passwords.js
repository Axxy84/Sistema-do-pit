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

// Lista de senhas comuns para testar
const commonPasswords = [
  'postgres',
  'pizzaria123',
  'pizza123',
  'admin123',
  '123456',
  'password',
  'pizzaria',
  'root',
  'admin',
  '12345',
  'pizza',
  'sistema123',
  'test123'
];

async function testPassword(password) {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: password,
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 3000
  });

  try {
    const client = await pool.connect();
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    await pool.end();
    return false;
  }
}

async function main() {
  log('\n=== TESTADOR DE SENHAS COMUNS ===\n', 'blue');
  
  log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}`);
  log(`Banco: ${process.env.DB_NAME}`);
  log(`Usuário: ${process.env.DB_USER}\n`);
  
  log('Testando senhas comuns...', 'yellow');
  
  for (const password of commonPasswords) {
    process.stdout.write(`Testando: ${password.padEnd(15)} ... `);
    
    const success = await testPassword(password);
    
    if (success) {
      log('✅ SENHA ENCONTRADA!', 'green');
      log(`\nA senha correta é: ${password}`, 'green');
      log('\nAtualize seu arquivo .env com:', 'yellow');
      log(`DB_PASSWORD=${password}`, 'blue');
      
      // Perguntar se quer atualizar automaticamente
      log('\nOu execute: node verify_password.js', 'yellow');
      log(`E digite: ${password}`, 'blue');
      
      process.exit(0);
    } else {
      log('❌', 'red');
    }
  }
  
  log('\n❌ Nenhuma senha comum funcionou', 'red');
  log('\nVocê precisará:', 'yellow');
  log('1. Resetar a senha no servidor PostgreSQL', 'reset');
  log('2. Ou lembrar a senha correta', 'reset');
  log('\nConsulte o arquivo reset-password-guide.md para instruções', 'blue');
  
  process.exit(1);
}

main().catch(error => {
  log(`\nErro: ${error.message}`, 'red');
  process.exit(1);
});