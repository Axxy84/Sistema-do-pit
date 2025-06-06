// Configurações de ambiente
// Copie este arquivo para .env na raiz do backend ou configure as variáveis diretamente

module.exports = {
  // Configuração do Banco de Dados
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'pizzaria_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  // Configuração JWT
  JWT_SECRET: process.env.JWT_SECRET || 'sua_chave_secreta_muito_forte_aqui_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Configuração do Servidor
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS (permitir requisições do frontend)
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

/*
Para usar, crie um arquivo .env na raiz da pasta backend com:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=sua_chave_secreta_muito_forte_aqui_change_me
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
*/ 