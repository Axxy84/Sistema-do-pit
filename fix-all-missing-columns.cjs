require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixAllMissingColumns() {
  try {
    console.log('🔧 Corrigindo todas as colunas faltantes na tabela pedidos...\n');
    
    // Definir todas as colunas que podem estar faltando
    const expectedColumns = [
      { name: 'tipo_pedido', type: 'VARCHAR(50)', default: "'balcao'" },
      { name: 'numero_mesa', type: 'INTEGER', default: 'NULL' },
      { name: 'endereco_entrega', type: 'TEXT', default: 'NULL' },
      { name: 'observacoes', type: 'TEXT', default: 'NULL' },
      { name: 'tempo_preparo', type: 'INTEGER', default: 'NULL' },
      { name: 'status', type: 'VARCHAR(50)', default: "'pendente'" }
    ];
    
    // Verificar quais colunas existem
    const existingColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos';
    `;
    
    const existingResult = await pool.query(existingColumnsQuery);
    const existingColumns = existingResult.rows.map(row => row.column_name);
    
    console.log('📋 Colunas existentes:', existingColumns.join(', '));
    console.log('');
    
    // Adicionar colunas faltantes
    for (const col of expectedColumns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`🔨 Adicionando coluna: ${col.name}`);
        
        const addColumnQuery = `
          ALTER TABLE pedidos 
          ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default};
        `;
        
        try {
          await pool.query(addColumnQuery);
          console.log(`✅ Coluna ${col.name} adicionada com sucesso!`);
        } catch (error) {
          console.log(`❌ Erro ao adicionar ${col.name}: ${error.message}`);
        }
      } else {
        console.log(`✅ Coluna ${col.name} já existe`);
      }
    }
    
    console.log('\n🔍 Verificando resultado final...');
    
    // Verificar resultado final
    const finalResult = await pool.query(existingColumnsQuery);
    const finalColumns = finalResult.rows.map(row => row.column_name);
    
    console.log('📋 Colunas finais na tabela pedidos:');
    finalColumns.forEach(col => {
      const isNew = !existingColumns.includes(col);
      console.log(`   - ${col} ${isNew ? '(NOVA)' : ''}`);
    });
    
    console.log('\n✅ Migração de colunas concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    pool.end();
  }
}

fixAllMissingColumns(); 