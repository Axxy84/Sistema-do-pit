const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
});

client.connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL WSL!'))
  .catch(err => console.error('❌ Erro de conexão com o PostgreSQL:', err));

module.exports = client;
