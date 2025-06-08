const { Pool } = require('pg');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Cores para output
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

// Função para ocultar entrada de senha
function askPassword(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Ocultar a entrada
    rl.input.on('keypress', () => {
      readline.moveCursor(rl.output, -1, 0);
      readline.clearLine(rl.output, 1);
      rl.output.write('*');
    });

    rl.question(question, (answer) => {
      rl.close();
      console.log(); // Nova linha após a senha
      resolve(answer);
    });

    // Configurar para ocultar entrada
    rl._writeToOutput = function _writeToOutput() {
      // Não escrever nada durante a digitação
    };
  });
}

// Função para testar conexão
async function testConnection(password) {
  const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: password,
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 5000
  };

  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    client.release();
    await pool.end();
    return { success: true };
  } catch (error) {
    await pool.end();
    return { 
      success: false, 
      isAuthError: error.message.includes('password authentication failed')
    };
  }
}

// Função para atualizar o arquivo .env
function updateEnvFile(newPassword) {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Regex para encontrar a linha DB_PASSWORD
    const regex = /^DB_PASSWORD=.*$/m;
    
    if (regex.test(envContent)) {
      // Substituir a senha existente
      envContent = envContent.replace(regex, `DB_PASSWORD=${newPassword}`);
    } else {
      // Adicionar DB_PASSWORD se não existir
      envContent += `\nDB_PASSWORD=${newPassword}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    return true;
  } catch (error) {
    log(`Erro ao atualizar .env: ${error.message}`, 'red');
    return false;
  }
}

// Função principal
async function main() {
  log('\n=== VERIFICADOR DE SENHA POSTGRESQL ===\n', 'blue');

  // Verificar variáveis necessárias
  const required = ['DB_USER', 'DB_HOST', 'DB_NAME'];
  const missing = required.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    log(`❌ Variáveis faltando: ${missing.join(', ')}`, 'red');
    log('Configure-as no arquivo .env', 'yellow');
    process.exit(1);
  }

  // Mostrar configuração (sem senha)
  log('Configuração atual:', 'blue');
  log(`  Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}`);
  log(`  Banco: ${process.env.DB_NAME}`);
  log(`  Usuário: ${process.env.DB_USER}`);
  log(`  Senha: ${process.env.DB_PASSWORD ? '***' : 'NÃO DEFINIDA'}\n`);

  // Testar senha atual
  if (process.env.DB_PASSWORD) {
    log('Testando senha configurada...', 'yellow');
    const result = await testConnection(process.env.DB_PASSWORD);
    
    if (result.success) {
      log('✅ Senha correta – conexão OK', 'green');
      process.exit(0);
    } else if (result.isAuthError) {
      log('❌ Senha incorreta', 'red');
    } else {
      log('❌ Erro de conexão (não relacionado à senha)', 'red');
      process.exit(1);
    }
  } else {
    log('⚠️  DB_PASSWORD não está definida no .env', 'yellow');
  }

  // Solicitar nova senha
  log('\nDigite a senha correta para o usuário ' + process.env.DB_USER + ':', 'yellow');
  const newPassword = await askPassword('Senha: ');

  if (!newPassword || newPassword.trim() === '') {
    log('❌ Senha não pode ser vazia', 'red');
    process.exit(1);
  }

  // Testar nova senha
  log('\nTestando nova senha...', 'yellow');
  const result = await testConnection(newPassword);

  if (result.success) {
    log('✅ Nova senha validada', 'green');
    
    // Atualizar .env
    log('\nAtualizando arquivo .env...', 'yellow');
    if (updateEnvFile(newPassword)) {
      log('✅ Arquivo .env atualizado com sucesso', 'green');
      log('\nA senha foi salva no arquivo .env', 'blue');
      process.exit(0);
    } else {
      log('❌ Falha ao atualizar .env', 'red');
      log('Atualize manualmente: DB_PASSWORD=' + newPassword.replace(/./g, '*'), 'yellow');
      process.exit(1);
    }
  } else {
    log('❌ Senha ainda incorreta ou erro de conexão', 'red');
    process.exit(1);
  }
}

// Capturar Ctrl+C
process.on('SIGINT', () => {
  log('\n\nOperação cancelada', 'yellow');
  process.exit(1);
});

// Executar
main().catch(error => {
  log(`\nErro inesperado: ${error.message}`, 'red');
  process.exit(1);
});