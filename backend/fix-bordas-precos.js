require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function fixBordasPrecos() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔄 Iniciando correção dos preços das bordas...\n');
    
    // 1. Verificar as bordas na tabela produtos
    const bordasProdutosResult = await client.query(`
      SELECT id, nome, tipo_produto, preco_unitario, ativo
      FROM produtos
      WHERE tipo_produto = 'borda'
      ORDER BY nome
    `);
    
    console.log(`📋 Encontradas ${bordasProdutosResult.rows.length} bordas na tabela produtos:`);
    bordasProdutosResult.rows.forEach(produto => {
      console.log(`   • ${produto.nome}: R$ ${produto.preco_unitario || '0.00'} (${produto.ativo ? 'Ativo' : 'Inativo'})`);
    });
    
    // 2. Buscar os preços corretos da tabela bordas
    const bordasResult = await client.query(`
      SELECT id, nome, preco_adicional, disponivel
      FROM bordas
      ORDER BY nome
    `);
    
    console.log(`\n📋 Encontradas ${bordasResult.rows.length} bordas na tabela bordas:`);
    bordasResult.rows.forEach(borda => {
      console.log(`   • ${borda.nome}: R$ ${borda.preco_adicional} (${borda.disponivel ? 'Disponível' : 'Indisponível'})`);
    });
    
    // 3. Atualizar os preços na tabela produtos
    console.log('\n🔄 Atualizando preços das bordas na tabela produtos...');
    
    let atualizadas = 0;
    
    for (const borda of bordasResult.rows) {
      // Buscar produto correspondente
      const produto = bordasProdutosResult.rows.find(p => p.nome === borda.nome);
      
      if (produto) {
        // Verificar se o preço precisa ser atualizado
        if (produto.preco_unitario !== borda.preco_adicional) {
          console.log(`   • Atualizando ${borda.nome}: R$ ${produto.preco_unitario || '0.00'} -> R$ ${borda.preco_adicional}`);
          
          await client.query(`
            UPDATE produtos
            SET preco_unitario = $1, updated_at = NOW()
            WHERE id = $2
          `, [borda.preco_adicional, produto.id]);
          
          atualizadas++;
        } else {
          console.log(`   • ${borda.nome}: Preço já está correto (R$ ${borda.preco_adicional})`);
        }
      } else {
        console.log(`   • ${borda.nome}: Não encontrada na tabela produtos, criando...`);
        
        // Inserir nova borda na tabela produtos
        await client.query(`
          INSERT INTO produtos (nome, tipo_produto, preco_unitario, ativo)
          VALUES ($1, 'borda', $2, $3)
        `, [borda.nome, borda.preco_adicional, borda.disponivel]);
        
        atualizadas++;
      }
    }
    
    // 4. Verificar resultado final
    const resultadoFinal = await client.query(`
      SELECT id, nome, tipo_produto, preco_unitario, ativo
      FROM produtos
      WHERE tipo_produto = 'borda'
      ORDER BY nome
    `);
    
    console.log(`\n✅ Correção concluída! ${atualizadas} bordas atualizadas.`);
    console.log(`\n📋 Lista final de bordas na tabela produtos:`);
    resultadoFinal.rows.forEach(produto => {
      console.log(`   • ${produto.nome}: R$ ${produto.preco_unitario || '0.00'} (${produto.ativo ? 'Ativo' : 'Inativo'})`);
    });
    
    console.log('\n✨ Processo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    console.error(error.stack);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

fixBordasPrecos(); 