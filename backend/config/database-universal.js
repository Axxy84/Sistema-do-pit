const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbConnection = null;

// Configuração para SQLite
async function createSQLiteConnection() {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = process.env.DB_PATH || './data/pizzaria.db';
    
    // Criar pasta data se não existir
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Erro ao conectar SQLite:', err);
          reject(err);
        } else {
          console.log('✅ Conectado ao SQLite:', dbPath);
          resolve(db);
        }
      });
    });
  } catch (error) {
    console.error('❌ SQLite não disponível:', error.message);
    throw error;
  }
}

// Configuração para PostgreSQL
async function createPostgreSQLConnection() {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'pizzaria_db',
      password: String(process.env.DB_PASSWORD || 'postgres'),
      port: parseInt(process.env.DB_PORT) || 5432,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: false,
    });

    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL');
    
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error.message);
    throw error;
  }
}

// Adaptador universal de query
async function query(text, params = []) {
  if (!dbConnection) {
    throw new Error('Conexão de banco não inicializada');
  }

  const dbType = process.env.DB_TYPE || 'postgresql';
  
  if (dbType === 'sqlite') {
    return new Promise((resolve, reject) => {
      // Converter query PostgreSQL para SQLite se necessário
      let sqliteQuery = text.replace(/\$(\d+)/g, '?'); // $1, $2 -> ?
      
      if (sqliteQuery.includes('RETURNING')) {
        // SQLite não suporta RETURNING, simular com INSERT + SELECT
        if (sqliteQuery.includes('INSERT')) {
          const baseQuery = sqliteQuery.split(' RETURNING')[0];
          dbConnection.run(baseQuery, params, function(err) {
            if (err) reject(err);
            else {
              // Retornar o último ID inserido
              resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
            }
          });
          return;
        }
      }
      
      if (sqliteQuery.toUpperCase().startsWith('SELECT')) {
        dbConnection.all(sqliteQuery, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows, rowCount: rows.length });
        });
      } else {
        dbConnection.run(sqliteQuery, params, function(err) {
          if (err) reject(err);
          else resolve({ rows: [], rowCount: this.changes });
        });
      }
    });
  } else {
    // PostgreSQL
    return await dbConnection.query(text, params);
  }
}

// Inicializar conexão
async function initializeDatabase() {
  const dbType = process.env.DB_TYPE || 'postgresql';
  
  console.log(`🔄 Inicializando banco: ${dbType}`);
  
  try {
    if (dbType === 'sqlite') {
      dbConnection = await createSQLiteConnection();
    } else {
      dbConnection = await createPostgreSQLConnection();
    }
    
    console.log('✅ Banco de dados inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Falha ao inicializar banco:', error.message);
    
    // Fallback para SQLite se PostgreSQL falhar
    if (dbType !== 'sqlite') {
      console.log('🔄 Tentando fallback para SQLite...');
      try {
        process.env.DB_TYPE = 'sqlite';
        dbConnection = await createSQLiteConnection();
        console.log('✅ Fallback SQLite bem-sucedido');
        return true;
      } catch (sqliteError) {
        console.error('❌ Fallback SQLite também falhou:', sqliteError.message);
        throw sqliteError;
      }
    }
    
    throw error;
  }
}

// Fechar conexão
async function closeDatabase() {
  if (dbConnection) {
    const dbType = process.env.DB_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      return new Promise((resolve) => {
        dbConnection.close((err) => {
          if (err) console.error('Erro ao fechar SQLite:', err);
          else console.log('SQLite desconectado');
          resolve();
        });
      });
    } else {
      await dbConnection.end();
      console.log('PostgreSQL desconectado');
    }
    
    dbConnection = null;
  }
}

module.exports = {
  query,
  initializeDatabase,
  closeDatabase,
  get connection() { return dbConnection; },
  get dbType() { return process.env.DB_TYPE || 'postgresql'; }
};