// Configuração específica para o servidor neural
// Copie este conteúdo para seu arquivo .env

module.exports = {
  // Configuração do Banco de Dados - Neural
  DB_HOST: process.env.DB_HOST || '192.168.0.105',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'pizzaria_db',
  DB_USER: process.env.DB_USER || 'pizzaria_user',
  DB_PASSWORD: process.env.DB_PASS || 'pizzaria_pass', // Note: DB_PASS (como na sua doc)

  // Configuração JWT
  JWT_SECRET: process.env.JWT_SECRET || 'pizzaria_neural_secret_key_super_forte_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Configuração do Servidor
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

/*
Crie um arquivo .env na pasta backend com:

DB_HOST=192.168.0.105
DB_PORT=5432
DB_USER=pizzaria_user
DB_PASS=pizzaria_pass
DB_NAME=pizzaria_db
JWT_SECRET=pizzaria_neural_secret_key_super_forte_2024
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
*/ 