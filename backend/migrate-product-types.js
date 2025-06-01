const { Pool } = require('pg');

// Configuração específica para o servidor neural
const pool = new Pool({
  user: 'postgres',
  host: '192.168.0.105',  // IP do servidor neural
  database: 'pizzaria_db',
  password: 'postgres',
  port: 5432,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const db = {
  query: (text, params) => pool.query(text, params),
  pool
};

async function migrateProductTypes() {
    console.log('🔄 Iniciando migração da constraint produtos_tipo_produto_check...');
    
    try {
        // Testar conexão
        console.log('🔗 Testando conexão com o banco...');
        await db.query('SELECT 1');
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Remover constraint existente
        console.log('📋 Removendo constraint existente...');
        await db.query(`
            ALTER TABLE produtos
            DROP CONSTRAINT IF EXISTS produtos_tipo_produto_check;
        `);
        
        // Adicionar nova constraint com 'borda'
        console.log('✅ Adicionando nova constraint com tipo "borda"...');
        await db.query(`
            ALTER TABLE produtos
            ADD CONSTRAINT produtos_tipo_produto_check 
            CHECK (tipo_produto IN ('pizza', 'bebida', 'sobremesa', 'acompanhamento', 'outro', 'borda'));
        `);
        
        // Verificar se foi aplicada
        console.log('🔍 Verificando constraint aplicada...');
        const result = await db.query(`
            SELECT conname, pg_get_constraintdef(oid) as constraint_def
            FROM pg_constraint
            WHERE conrelid = 'produtos'::regclass AND conname = 'produtos_tipo_produto_check';
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Constraint atualizada com sucesso!');
            console.log('📝 Detalhes:', result.rows[0]);
        } else {
            console.log('❌ Constraint não foi encontrada após a migração');
        }
        
    } catch (error) {
        console.error('❌ Erro durante a migração:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar migração
migrateProductTypes()
    .then(() => {
        console.log('🎉 Migração concluída com sucesso!');
        console.log('💡 Agora você pode cadastrar bordas de pizza no sistema!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Falha na migração:', error);
        process.exit(1);
    }); 