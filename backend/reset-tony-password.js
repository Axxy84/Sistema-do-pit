const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pizzaria_db',
  user: 'postgres',
  password: '8477'
});

async function resetTonyPassword() {
  try {
    console.log('🔄 Resetando credenciais do Tony...');
    
    // Primeiro vamos verificar se o usuário admin existe
    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@pizzaria.com']);
    
    if (checkUser.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado, criando...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
        ['admin@pizzaria.com', hashedPassword]
      );
      console.log('✅ Usuário admin criado com sucesso!');
    } else {
      console.log('✅ Usuário admin encontrado, atualizando senha...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, 'admin@pizzaria.com']
      );
      console.log('✅ Senha atualizada!');
    }
    
    // Verificar o resultado final
    const finalCheck = await pool.query('SELECT email FROM users WHERE email = $1', ['admin@pizzaria.com']);
    console.log('📋 Status final do usuário:', finalCheck.rows[0]);
    
    console.log('\n🎯 CREDENCIAIS PARA ACESSO AO TONY:');
    console.log('Email: admin@pizzaria.com');
    console.log('Senha: admin123');
    console.log('Owner Access: ✅ Habilitado');
    
    console.log('\n📝 COMO ACESSAR:');
    console.log('1. Faça login normal no sistema com essas credenciais');
    console.log('2. Vá para a URL: http://localhost:5173/tony');
    console.log('3. Faça o login específico do Tony com as mesmas credenciais');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

resetTonyPassword();