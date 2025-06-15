const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pizzaria_db',
  user: 'postgres',
  password: '8477'
});

async function createAdminProfile() {
  try {
    console.log('🔄 Criando perfil para o usuário admin...');
    
    // Buscar o ID do usuário admin
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@pizzaria.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('✅ Usuário admin encontrado:', userId);
    
    // Verificar se já tem perfil
    const profileCheck = await pool.query('SELECT id FROM profiles WHERE id = $1', [userId]);
    
    if (profileCheck.rows.length > 0) {
      console.log('✅ Perfil já existe, atualizando...');
      await pool.query(
        'UPDATE profiles SET full_name = $1, role = $2 WHERE id = $3',
        ['Administrador', 'admin', userId]
      );
    } else {
      // Criar perfil para o admin
      await pool.query(
        'INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3)',
        [userId, 'Administrador', 'admin']
      );
      console.log('✅ Perfil criado para o admin');
    }
    
    // Verificar resultado final
    const finalCheck = await pool.query(`
      SELECT u.id, u.email, p.full_name, p.role 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.email = $1
    `, ['admin@pizzaria.com']);
    
    console.log('📋 Dados finais do admin:', finalCheck.rows[0]);
    
    console.log('\n🎯 AGORA VOCÊ PODE FAZER LOGIN COM:');
    console.log('Email: admin@pizzaria.com');
    console.log('Senha: admin123');
    console.log('Role: admin');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

createAdminProfile();