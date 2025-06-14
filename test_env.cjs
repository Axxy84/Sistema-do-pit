require('dotenv').config({ path: './backend/.env' });

console.log('=== TESTE VARIÁVEIS DE AMBIENTE ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

// Teste direto com pg
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'pizzaria_user',
  password: '8477',
  database: 'pizzaria_db',
});

console.log('\n=== TESTE CONEXÃO DIRETA ===');
client.connect()
  .then(() => {
    console.log('✅ Conexão direta funcionou!');
    return client.query('SELECT version()');
  })
  .then(res => {
    console.log('✅ Versão PostgreSQL:', res.rows[0].version);
    client.end();
  })
  .catch(err => {
    console.error('❌ Erro na conexão direta:', err.message);
    client.end();
  });