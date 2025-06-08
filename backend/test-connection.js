const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Testando conexão com PostgreSQL...\n');

// Mostra as variáveis de ambiente (sem a senha completa)
console.log('📋 Configurações:');
console.log('- Host:', process.env.DB_HOST || 'localhost');
console.log('- Port:', process.env.DB_PORT || 5432);
console.log('- Database:', process.env.DB_NAME || 'pizzaria_db');
console.log('- User:', process.env.DB_USER || 'postgres');
console.log('- Password:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NOT SET');
console.log('');

// Cria uma nova conexão para teste
const testPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pizzaria_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 5000,
});

// Testa a conexão
async function testConnection() {
  try {
    // Teste 1: Conexão básica
    console.log('🔄 Tentando conectar...');
    const client = await testPool.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Teste 2: Query simples
    console.log('🔄 Executando query de teste...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query executada com sucesso!');
    console.log('- Hora atual no banco:', result.rows[0].current_time);
    console.log('- Versão do PostgreSQL:', result.rows[0].pg_version.split(',')[0]);
    console.log('');

    // Teste 3: Verifica tabelas
    console.log('🔄 Verificando tabelas existentes...');
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
      LIMIT 10
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Tabelas encontradas:');
      tables.rows.forEach(row => console.log(`   - ${row.tablename}`));
    } else {
      console.log('⚠️  Nenhuma tabela encontrada no schema public');
    }

    // Libera a conexão
    client.release();
    
    console.log('\n✨ Todos os testes passaram! Conexão funcionando perfeitamente.');
    
  } catch (error) {
    console.error('\n❌ Erro ao conectar:', error.message);
    
    // Diagnóstico adicional
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Diagnóstico: Conexão recusada');
      console.log('   - Verifique se o PostgreSQL está rodando');
      console.log('   - Verifique se o host e porta estão corretos');
      console.log('   - Execute: sudo systemctl status postgresql');
    } else if (error.code === '28P01' || error.message.includes('password')) {
      console.log('\n💡 Diagnóstico: Erro de autenticação');
      console.log('   - Verifique o usuário e senha no arquivo .env');
      console.log('   - Confirme que o usuário existe no PostgreSQL');
    } else if (error.code === '3D000') {
      console.log('\n💡 Diagnóstico: Banco de dados não existe');
      console.log('   - Crie o banco com: CREATE DATABASE pizzaria_db;');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 Diagnóstico: Timeout na conexão');
      console.log('   - Verifique se há firewall bloqueando a porta 5432');
      console.log('   - Verifique se o PostgreSQL está configurado para aceitar conexões remotas');
    }
  } finally {
    // Fecha o pool
    await testPool.end();
  }
}

// Executa o teste
testConnection();