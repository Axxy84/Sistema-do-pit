require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function migrateBordasToProdutos() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔄 Iniciando migração de bordas para produtos...\n');
    
    // 1. Buscar todas as bordas da tabela bordas
    const bordasResult = await client.query(`
      SELECT id, nome, preco_adicional, disponivel
      FROM bordas
      ORDER BY nome
    `);
    
    if (bordasResult.rows.length === 0) {
      console.log('⚠️ Nenhuma borda encontrada na tabela bordas.');
      return;
    }
    
    console.log(`📋 Encontradas ${bordasResult.rows.length} bordas para migrar:`);
    bordasResult.rows.forEach(borda => {
      console.log(`   • ${borda.nome}: R$ ${borda.preco_adicional} (${borda.disponivel ? 'Disponível' : 'Indisponível'})`);
    });
    
    // 2. Para cada borda, verificar se já existe na tabela produtos
    for (const borda of bordasResult.rows) {
      const checkProdutoQuery = `
        SELECT id FROM produtos WHERE nome = $1 AND tipo_produto = 'borda'
      `;
      const checkResult = await client.query(checkProdutoQuery, [borda.nome]);
      
      if (checkResult.rows.length > 0) {
        // 2.1 Se já existe, atualizar o preço
        console.log(`⚠️ Borda "${borda.nome}" já existe na tabela produtos, atualizando...`);
        
        const updateQuery = `
          UPDATE produtos
          SET preco_unitario = $1,
              ativo = $2,
              updated_at = NOW()
          WHERE id = $3
        `;
        
        await client.query(updateQuery, [
          borda.preco_adicional,
          borda.disponivel,
          checkResult.rows[0].id
        ]);
        
        console.log(`✅ Borda "${borda.nome}" atualizada na tabela produtos.`);
      } else {
        // 2.2 Se não existe, inserir como novo produto
        console.log(`➕ Inserindo borda "${borda.nome}" na tabela produtos...`);
        
        const insertQuery = `
          INSERT INTO produtos (
            nome,
            tipo_produto,
            preco_unitario,
            ativo
          ) VALUES (
            $1, 'borda', $2, $3
          )
        `;
        
        await client.query(insertQuery, [
          borda.nome,
          borda.preco_adicional,
          borda.disponivel
        ]);
        
        console.log(`✅ Borda "${borda.nome}" inserida na tabela produtos.`);
      }
    }
    
    // 3. Verificar resultado final
    const finalCheckQuery = `
      SELECT id, nome, preco_unitario, ativo
      FROM produtos
      WHERE tipo_produto = 'borda'
      ORDER BY nome
    `;
    
    const finalResult = await client.query(finalCheckQuery);
    
    console.log(`\n🎉 Migração concluída! ${finalResult.rows.length} bordas na tabela produtos:`);
    finalResult.rows.forEach(produto => {
      console.log(`   • ${produto.nome}: R$ ${produto.preco_unitario} (${produto.ativo ? 'Ativo' : 'Inativo'})`);
    });
    
    console.log('\n✨ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    console.error(error.stack);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

migrateBordasToProdutos(); 