const pool = require('./config/database');

const bordas = [
  { nome: 'Beijinho', preco: 8.00 },
  { nome: 'Brigadeiro', preco: 8.00 },
  { nome: 'Doce de Leite', preco: 8.00 },
  { nome: 'Goiabada', preco: 7.00 },
  { nome: 'Romeu e Julieta', preco: 10.00 },
  { nome: 'Nutella', preco: 10.00 }
];

async function createTableAndInsertBordas() {
  try {
    console.log('🍕 Iniciando configuração de bordas...\n');

    // 1. Criar a tabela se não existir
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS bordas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        preco_adicional DECIMAL(10,2) NOT NULL DEFAULT 0,
        disponivel BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Tabela de bordas verificada/criada');

    // 2. Criar índice
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_bordas_disponivel ON bordas(disponivel)
    `;
    
    await pool.query(createIndexQuery);
    console.log('✅ Índice criado/verificado');

    // 3. Inserir as bordas
    console.log('\n📝 Inserindo bordas do cardápio...\n');
    
    for (const borda of bordas) {
      // Verificar se já existe
      const checkQuery = 'SELECT id FROM bordas WHERE nome = $1';
      const checkResult = await pool.query(checkQuery, [borda.nome]);

      if (checkResult.rows.length > 0) {
        console.log(`⚠️  Borda "${borda.nome}" já existe, atualizando preço...`);
        
        // Atualizar borda existente
        const updateQuery = `
          UPDATE bordas 
          SET preco_adicional = $1,
              disponivel = true,
              updated_at = NOW()
          WHERE nome = $2
        `;
        
        await pool.query(updateQuery, [borda.preco, borda.nome]);
        console.log(`✅ Borda "${borda.nome}" atualizada - R$ ${borda.preco.toFixed(2)}`);
      } else {
        // Inserir nova borda
        const insertQuery = `
          INSERT INTO bordas (nome, preco_adicional, disponivel)
          VALUES ($1, $2, $3)
        `;
        
        await pool.query(insertQuery, [borda.nome, borda.preco, true]);
        console.log(`✅ Borda "${borda.nome}" inserida - R$ ${borda.preco.toFixed(2)}`);
      }
    }

    // 4. Mostrar resumo
    const countQuery = 'SELECT COUNT(*) as total FROM bordas WHERE disponivel = true';
    const countResult = await pool.query(countQuery);
    
    console.log('\n📊 Resumo:');
    console.log(`   Total de bordas disponíveis: ${countResult.rows[0].total}`);
    
    // 5. Listar todas as bordas
    const listQuery = `
      SELECT nome, preco_adicional 
      FROM bordas 
      WHERE disponivel = true 
      ORDER BY nome
    `;
    const listResult = await pool.query(listQuery);
    
    console.log('\n🍕 Bordas cadastradas:');
    listResult.rows.forEach((borda, index) => {
      console.log(`   ${index + 1}. ${borda.nome} - R$ ${parseFloat(borda.preco_adicional).toFixed(2)}`);
    });

    console.log('\n✨ Todas as bordas foram configuradas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar bordas:', error.message);
    console.error('Detalhes:', error);
  }
}

// Executar o script
createTableAndInsertBordas();