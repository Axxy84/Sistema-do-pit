const fs = require('fs');
const path = require('path');
const db = require('../config/database-universal');

async function createTables() {
  console.log('🚀 Iniciando criação das tabelas universais...');
  
  try {
    await db.initializeDatabase();
    
    const dbType = db.dbType;
    console.log(`📋 Usando banco: ${dbType}`);
    
    // SQL para SQLite (mais simples)
    const sqliteQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category TEXT,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        items TEXT, -- JSON string
        total DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    // SQL para PostgreSQL (mais complexo)
    const postgresQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        customer_address TEXT,
        items JSONB,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS configurations (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    const queries = dbType === 'sqlite' ? sqliteQueries : postgresQueries;
    
    // Executar queries
    for (const query of queries) {
      try {
        await db.query(query);
        console.log('✅ Tabela criada/verificada');
      } catch (error) {
        console.error('❌ Erro ao criar tabela:', error.message);
      }
    }
    
    // Inserir usuário admin padrão
    await createDefaultAdmin();
    await createDefaultConfigurations();
    
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

async function createDefaultAdmin() {
  try {
    // Verificar se já existe admin
    const result = await db.query('SELECT * FROM users WHERE email = ?', ['admin@pizzaria.com']);
    
    if (result.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.query(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin@pizzaria.com', hashedPassword, 'Administrador', 'admin']
      );
      
      console.log('✅ Usuário admin criado: admin@pizzaria.com / admin123');
    } else {
      console.log('✅ Usuário admin já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
  }
}

async function createDefaultConfigurations() {
  try {
    const configs = [
      { key: 'pizzaria_name', value: 'Pizzaria do PIT', description: 'Nome da pizzaria' },
      { key: 'delivery_fee', value: '5.00', description: 'Taxa de entrega padrão' },
      { key: 'timezone', value: 'America/Sao_Paulo', description: 'Fuso horário' }
    ];
    
    for (const config of configs) {
      try {
        await db.query(
          'INSERT OR IGNORE INTO configurations (key, value, description) VALUES (?, ?, ?)',
          [config.key, config.value, config.description]
        );
      } catch (error) {
        // Tentar sintaxe PostgreSQL se SQLite falhar
        await db.query(
          'INSERT INTO configurations (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
          [config.key, config.value, config.description]
        );
      }
    }
    
    console.log('✅ Configurações padrão criadas');
  } catch (error) {
    console.error('❌ Erro ao criar configurações:', error.message);
  }
}

async function main() {
  try {
    await createTables();
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createTables, createDefaultAdmin };