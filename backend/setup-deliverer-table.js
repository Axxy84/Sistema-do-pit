const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function setupDelivererTable() {
  try {
    console.log('🔄 Configurando tabela de entregadores para o app...');
    
    // Verificar se as colunas necessárias existem
    const checkColumns = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'entregadores'
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('Colunas existentes:', existingColumns);
    
    // Adicionar colunas necessárias se não existirem
    const requiredColumns = [
      { name: 'senha_hash', type: 'VARCHAR(255)', comment: 'Hash da senha para login no app' },
      { name: 'ultimo_login', type: 'TIMESTAMP', comment: 'Data do último login no app' },
      { name: 'ativo', type: 'BOOLEAN DEFAULT true', comment: 'Se o entregador está ativo' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()', comment: 'Data de criação' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()', comment: 'Data de atualização' }
    ];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`📋 Adicionando coluna ${column.name}...`);
        
        await db.query(`
          ALTER TABLE entregadores 
          ADD COLUMN ${column.name} ${column.type};
        `);
        
        await db.query(`
          COMMENT ON COLUMN entregadores.${column.name} IS '${column.comment}';
        `);
        
        console.log(`✅ Coluna ${column.name} adicionada com sucesso!`);
      } else {
        console.log(`✅ Coluna ${column.name} já existe`);
      }
    }
    
    // Verificar se existem entregadores
    const existingDeliverers = await db.query('SELECT * FROM entregadores');
    console.log(`📊 Entregadores existentes: ${existingDeliverers.rows.length}`);
    
    if (existingDeliverers.rows.length === 0) {
      console.log('📋 Criando entregadores de exemplo...');
      
      // Criar entregadores de exemplo
      const exampleDeliverers = [
        { nome: 'João Silva', telefone: '11999999999', senha: '123456' },
        { nome: 'Maria Santos', telefone: '11888888888', senha: '123456' },
        { nome: 'Carlos Oliveira', telefone: '11777777777', senha: '123456' }
      ];
      
      for (const deliverer of exampleDeliverers) {
        const senhaHash = await bcrypt.hash(deliverer.senha, 10);
        
        await db.query(`
          INSERT INTO entregadores (nome, telefone, senha_hash, ativo) 
          VALUES ($1, $2, $3, true)
        `, [deliverer.nome, deliverer.telefone, senhaHash]);
        
        console.log(`✅ Entregador ${deliverer.nome} criado (telefone: ${deliverer.telefone}, senha: ${deliverer.senha})`);
      }
    } else {
      // Atualizar entregadores existentes sem senha
      console.log('📋 Verificando entregadores sem senha...');
      
      const deliverersWithoutPassword = await db.query(`
        SELECT id, nome, telefone 
        FROM entregadores 
        WHERE senha_hash IS NULL OR senha_hash = ''
      `);
      
      if (deliverersWithoutPassword.rows.length > 0) {
        console.log(`📋 ${deliverersWithoutPassword.rows.length} entregadores sem senha encontrados`);
        
        for (const deliverer of deliverersWithoutPassword.rows) {
          const defaultPassword = '123456';
          const senhaHash = await bcrypt.hash(defaultPassword, 10);
          
          await db.query(`
            UPDATE entregadores 
            SET senha_hash = $1, ativo = COALESCE(ativo, true), updated_at = NOW()
            WHERE id = $2
          `, [senhaHash, deliverer.id]);
          
          console.log(`✅ Senha padrão (${defaultPassword}) definida para ${deliverer.nome} (${deliverer.telefone})`);
        }
      }
    }
    
    // Listar todos os entregadores com credenciais
    const allDeliverers = await db.query(`
      SELECT id, nome, telefone, ativo, created_at 
      FROM entregadores 
      ORDER BY nome
    `);
    
    console.log('\n📋 CREDENCIAIS PARA LOGIN NO APP:');
    console.log('=====================================');
    
    for (const deliverer of allDeliverers.rows) {
      const status = deliverer.ativo ? '✅ ATIVO' : '❌ INATIVO';
      console.log(`👤 ${deliverer.nome}`);
      console.log(`   📱 Telefone: ${deliverer.telefone}`);
      console.log(`   🔒 Senha: 123456`);
      console.log(`   📊 Status: ${status}`);
      console.log('');
    }
    
    console.log('🎯 Para usar o app do entregador:');
    console.log('1. Faça login com telefone + senha');
    console.log('2. O token é válido por 30 dias');
    console.log('3. Conecte ao WebSocket: ws://localhost:3001/ws/deliverer');
    console.log('');
    console.log('✅ Configuração da tabela de entregadores concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar tabela de entregadores:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDelivererTable()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { setupDelivererTable };