const { Pool } = require('pg');
require('dotenv').config();

// Validação inicial
const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:', missingVars.join(', '));
  console.error('Configure-as no arquivo .env');
  process.exit(1);
}

// Configuração da conexão
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 5000
};

const pool = new Pool(dbConfig);

// Função para testar conexão
async function testConnection() {
  try {
    console.log('Conectando ao PostgreSQL...');
    const client = await pool.connect();
    
    console.log('✅ Conectado com sucesso!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Hora no servidor:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:');
    
    if (error.message.includes('password authentication failed')) {
      console.error('Senha incorreta para o usuário:', dbConfig.user);
      console.error('\nVerifique:');
      console.error('1. A senha no arquivo .env');
      console.error('2. Se o usuário existe no PostgreSQL');
      console.error('3. As permissões do usuário');
    } else {
      console.error(error.message);
    }
    
    console.error('\nConfigurações usadas:');
    console.error('Host:', dbConfig.host);
    console.error('Porta:', dbConfig.port);
    console.error('Banco:', dbConfig.database);
    console.error('Usuário:', dbConfig.user);
    
    return false;
  } finally {
    await pool.end();
  }
}

// Executar teste
testConnection();