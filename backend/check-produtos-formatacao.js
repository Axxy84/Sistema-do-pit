require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

async function checkProdutosFormatacao() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Verificando formatação dos preços dos produtos...\n');
    
    // 1. Verificar as bordas na tabela produtos
    const bordasProdutosResult = await client.query(`
      SELECT id, nome, tipo_produto, preco_unitario, ativo
      FROM produtos
      WHERE tipo_produto = 'borda'
      ORDER BY nome
    `);
    
    console.log(`📋 Encontradas ${bordasProdutosResult.rows.length} bordas na tabela produtos:`);
    bordasProdutosResult.rows.forEach(produto => {
      const preco = produto.preco_unitario;
      console.log(`   • ${produto.nome}: R$ ${preco} (${produto.ativo ? 'Ativo' : 'Inativo'})`);
      console.log(`     - Tipo de dado: ${typeof preco}`);
      console.log(`     - Valor numérico: ${Number(preco)}`);
      console.log(`     - É número finito: ${Number.isFinite(Number(preco))}`);
      console.log(`     - Formatação JSON: ${JSON.stringify(preco)}`);
    });
    
    // 2. Verificar se há algum problema de formatação
    let problemasEncontrados = false;
    
    for (const produto of bordasProdutosResult.rows) {
      const preco = produto.preco_unitario;
      
      if (preco === null || preco === undefined) {
        console.log(`\n❌ PROBLEMA: ${produto.nome} tem preço nulo ou indefinido`);
        problemasEncontrados = true;
      } else if (typeof preco === 'string' && !preco.trim()) {
        console.log(`\n❌ PROBLEMA: ${produto.nome} tem preço como string vazia`);
        problemasEncontrados = true;
      } else if (isNaN(Number(preco))) {
        console.log(`\n❌ PROBLEMA: ${produto.nome} tem preço não numérico: "${preco}"`);
        problemasEncontrados = true;
      }
    }
    
    if (!problemasEncontrados) {
      console.log('\n✅ Nenhum problema de formatação encontrado nos preços das bordas!');
    } else {
      console.log('\n⚠️ Problemas de formatação encontrados! Recomenda-se corrigir os valores.');
    }
    
    // 3. Verificar a função getDisplayPrice do frontend
    console.log('\n📋 Simulação da função getDisplayPrice do frontend:');
    
    for (const produto of bordasProdutosResult.rows) {
      const preco = produto.preco_unitario;
      let displayPrice;
      
      if (preco !== null && preco !== undefined) {
        const precoNumerico = Number.isFinite(Number(preco)) ? Number(preco) : 0;
        displayPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoNumerico);
      } else {
        displayPrice = 'R$ 0,00';
      }
      
      console.log(`   • ${produto.nome}: ${displayPrice}`);
    }
    
    console.log('\n✨ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.error(error.stack);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

checkProdutosFormatacao(); 