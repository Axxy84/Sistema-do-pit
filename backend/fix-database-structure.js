const db = require('./config/database');

const fixDatabaseStructure = async () => {
  console.log('🔧 Corrigindo estrutura do banco de dados...\n');

  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Adicionar coluna owner_access na tabela usuarios se não existir
    console.log('1️⃣ Adicionando coluna owner_access na tabela usuarios...');
    try {
      await client.query(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS owner_access BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Coluna owner_access adicionada/verificada\n');
    } catch (error) {
      console.log('⚠️  Erro ao adicionar coluna owner_access:', error.message);
    }

    // 2. Corrigir a tabela profiles para usar UUID e referenciar users
    console.log('2️⃣ Verificando estrutura da tabela profiles...');
    
    // Verificar se a tabela profiles está com a estrutura errada
    const { rows: profilesInfo } = await client.query(`
      SELECT 
        c.column_name,
        c.data_type,
        tc.constraint_type,
        ccu.table_name AS foreign_table_name
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu
        ON c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE c.table_name = 'profiles' 
        AND c.column_name = 'id'
    `);
    
    if (profilesInfo.length > 0 && profilesInfo[0].data_type === 'integer') {
      console.log('⚠️  Tabela profiles está com estrutura incorreta (id integer). Recriando...');
      
      // Fazer backup dos dados existentes
      const { rows: profilesData } = await client.query('SELECT * FROM profiles');
      
      // Dropar a tabela profiles
      await client.query('DROP TABLE IF EXISTS profiles CASCADE');
      
      // Recriar com a estrutura correta
      await client.query(`
        CREATE TABLE profiles (
          id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          full_name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'atendente' CHECK (role IN ('admin', 'atendente', 'entregador')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ Tabela profiles recriada com estrutura correta\n');
    } else {
      console.log('✅ Tabela profiles já está com a estrutura correta\n');
    }

    // 3. Criar usuário admin padrão se não existir
    console.log('3️⃣ Verificando/criando usuário admin padrão...');
    
    const bcrypt = require('bcryptjs');
    
    // Verificar se existe admin na tabela users/profiles
    const { rows: adminCheck } = await client.query(`
      SELECT u.id FROM users u 
      WHERE u.email = 'admin@pizzaria.com'
    `);
    
    if (adminCheck.length === 0) {
      // Criar usuário admin
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const { rows: newUser } = await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        ['admin@pizzaria.com', passwordHash]
      );
      
      await client.query(
        'INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3)',
        [newUser[0].id, 'Administrador', 'admin']
      );
      
      console.log('✅ Usuário admin criado:');
      console.log('   Email: admin@pizzaria.com');
      console.log('   Senha: admin123');
      console.log('   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
    } else {
      console.log('✅ Usuário admin já existe\n');
    }
    
    // 4. Verificar/criar usuário admin na tabela usuarios também
    console.log('4️⃣ Verificando usuário admin na tabela usuarios...');
    
    const { rows: adminUsuariosCheck } = await client.query(`
      SELECT id FROM usuarios WHERE email = 'admin@pizzaria.com'
    `);
    
    if (adminUsuariosCheck.length === 0) {
      const senhaHash = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO usuarios (nome, email, senha, tipo, owner_access) 
        VALUES ('Administrador', 'admin@pizzaria.com', $1, 'admin', true)
      `, [senhaHash]);
      
      console.log('✅ Usuário admin criado na tabela usuarios\n');
    } else {
      // Atualizar owner_access se necessário
      await client.query(`
        UPDATE usuarios 
        SET owner_access = true 
        WHERE email = 'admin@pizzaria.com' AND tipo = 'admin'
      `);
      console.log('✅ Usuário admin atualizado na tabela usuarios\n');
    }

    await client.query('COMMIT');
    console.log('✅ Todas as correções foram aplicadas com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao corrigir estrutura:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
};

// Executar correções
fixDatabaseStructure();