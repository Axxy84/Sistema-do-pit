const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

client.connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL do neural!'))
  .catch(err => console.error('❌ Erro de conexão com o PostgreSQL:', err));

module.exports = client;
