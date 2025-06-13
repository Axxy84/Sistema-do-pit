const jwt = require('jsonwebtoken');
const db = require('./config/database');
const config = require('./config/env');

async function generateTestToken() {
  try {
    console.log('🔑 GERANDO TOKEN DE TESTE...\n');
    
    // Primeiro, vamos verificar se há usuários na tabela
    const usersResult = await db.query('SELECT id, email FROM users LIMIT 1');
    
    let userId;
    
    if (usersResult.rows.length > 0) {
      // Usar usuário existente
      userId = usersResult.rows[0].id;
      console.log(`✅ Usando usuário existente: ${usersResult.rows[0].email} (ID: ${userId})`);
    } else {
      // Criar usuário de teste
      console.log('👤 Criando usuário de teste...');
      
      const newUserResult = await db.query(`
        INSERT INTO users (email, password_hash) 
        VALUES ($1, $2) 
        RETURNING id, email
      `, ['test@pitstop.com', 'test-hash']);
      
      userId = newUserResult.rows[0].id;
      
      // Criar perfil
      await db.query(`
        INSERT INTO profiles (id, full_name, role) 
        VALUES ($1, $2, $3)
      `, [userId, 'Usuário Teste', 'admin']);
      
      console.log(`✅ Usuário criado: ${newUserResult.rows[0].email} (ID: ${userId})`);
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { userId: userId }, 
      config.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log('\n🎯 TOKEN GERADO:');
    console.log(`${token}\n`);
    
    console.log('🧪 PARA TESTAR A API:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/products\n`);
    
    console.log('💾 Para usar no frontend:');
    console.log(`localStorage.setItem('authToken', '${token}');\n`);
    
    // Testar o token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    console.log('✅ Token válido! Dados decodificados:', decoded);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao gerar token:', error.message);
    process.exit(1);
  }
}

generateTestToken(); 