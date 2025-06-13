const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pizzaria_db',
  password: String(process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres'),
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false, // Desabilita SSL para conexões WSL
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL WSL (localhost)');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}; 