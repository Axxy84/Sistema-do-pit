const db = require('./config/database');

const checkDatabaseTables = async () => {
  console.log('🔍 Verificando estrutura do banco de dados...\n');

  try {
    // Verificar conexão
    await db.query('SELECT 1');
    console.log('✅ Conexão com banco de dados estabelecida\n');

    // Verificar tabelas principais para signup
    const tablesToCheck = [
      {
        name: 'users',
        expectedColumns: ['id', 'email', 'password_hash', 'created_at', 'updated_at']
      },
      {
        name: 'profiles',
        expectedColumns: ['id', 'full_name', 'role', 'created_at', 'updated_at']
      },
      {
        name: 'usuarios',
        expectedColumns: ['id', 'nome', 'email', 'senha', 'tipo', 'ativo', 'owner_access']
      }
    ];

    for (const table of tablesToCheck) {
      console.log(`📋 Verificando tabela: ${table.name}`);
      
      // Verificar se a tabela existe
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `;
      
      const { rows: tableExists } = await db.query(tableExistsQuery, [table.name]);
      
      if (!tableExists[0].exists) {
        console.log(`❌ Tabela ${table.name} NÃO existe!\n`);
        continue;
      }
      
      console.log(`✅ Tabela ${table.name} existe`);
      
      // Verificar colunas
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `;
      
      const { rows: columns } = await db.query(columnsQuery, [table.name]);
      
      console.log('   Colunas encontradas:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
      
      // Verificar colunas esperadas
      const foundColumns = columns.map(col => col.column_name);
      const missingColumns = table.expectedColumns.filter(col => !foundColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`   ⚠️  Colunas faltando: ${missingColumns.join(', ')}`);
      }
      
      console.log('');
    }

    // Verificar constraints e índices nas tabelas users/profiles
    console.log('🔍 Verificando constraints e índices:\n');
    
    const constraintsQuery = `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name IN ('users', 'profiles', 'usuarios')
      ORDER BY tc.table_name, tc.constraint_name
    `;
    
    const { rows: constraints } = await db.query(constraintsQuery);
    
    let currentTable = '';
    constraints.forEach(constraint => {
      if (currentTable !== constraint.table_name) {
        currentTable = constraint.table_name;
        console.log(`📋 Constraints da tabela ${currentTable}:`);
      }
      
      if (constraint.constraint_type === 'FOREIGN KEY') {
        console.log(`   - ${constraint.constraint_name}: ${constraint.column_name} -> ${constraint.foreign_table_name}(${constraint.foreign_column_name})`);
      } else {
        console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type} on ${constraint.column_name}`);
      }
    });

    // Verificar se existe pelo menos um usuário admin
    console.log('\n🔍 Verificando usuários existentes:\n');
    
    // Verificar na tabela users/profiles
    try {
      const { rows: adminUsers } = await db.query(`
        SELECT u.email, p.full_name, p.role 
        FROM users u
        JOIN profiles p ON u.id = p.id
        WHERE p.role = 'admin'
      `);
      
      if (adminUsers.length > 0) {
        console.log('✅ Usuários admin encontrados na tabela users/profiles:');
        adminUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.full_name}) - role: ${user.role}`);
        });
      } else {
        console.log('⚠️  Nenhum usuário admin encontrado na tabela users/profiles');
      }
    } catch (error) {
      console.log('⚠️  Erro ao buscar usuários admin em users/profiles:', error.message);
    }
    
    // Verificar na tabela usuarios
    try {
      const { rows: adminUsuarios } = await db.query(`
        SELECT email, nome, tipo, owner_access 
        FROM usuarios
        WHERE tipo = 'admin'
      `);
      
      if (adminUsuarios.length > 0) {
        console.log('\n✅ Usuários admin encontrados na tabela usuarios:');
        adminUsuarios.forEach(user => {
          console.log(`   - ${user.email} (${user.nome}) - tipo: ${user.tipo}, owner_access: ${user.owner_access}`);
        });
      } else {
        console.log('\n⚠️  Nenhum usuário admin encontrado na tabela usuarios');
      }
    } catch (error) {
      console.log('\n⚠️  Erro ao buscar usuários admin em usuarios:', error.message);
    }

    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
};

// Executar verificação
checkDatabaseTables();