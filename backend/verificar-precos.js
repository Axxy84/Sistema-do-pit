const db = require('./config/database');

async function verificarPrecos() {
  try {
    console.log('🔍 VERIFICANDO PREÇOS E TAMANHOS NO BANCO DE DADOS...\n');
    
    // Verificar algumas pizzas salgadas
    console.log('🍕 PIZZAS SALGADAS:');
    const pizzasSalgadas = await db.query(`
      SELECT nome, categoria, tamanhos_precos, ingredientes 
      FROM produtos 
      WHERE tipo_produto = 'pizza' AND categoria = 'salgada' 
      ORDER BY nome 
      LIMIT 5
    `);
    
    pizzasSalgadas.rows.forEach(pizza => {
      console.log(`\n📋 ${pizza.nome.toUpperCase()}`);
      console.log(`   Ingredientes: ${pizza.ingredientes}`);
      console.log('   Preços por tamanho:');
      
      if (pizza.tamanhos_precos && Array.isArray(pizza.tamanhos_precos)) {
        pizza.tamanhos_precos.forEach(tamanho => {
          console.log(`     • ${tamanho.tamanho}: R$ ${tamanho.preco.toFixed(2)}`);
        });
      } else {
        console.log('     ❌ Erro: tamanhos_precos não é um array válido');
      }
    });

    // Verificar algumas pizzas doces
    console.log('\n🍰 PIZZAS DOCES:');
    const pizzasDoces = await db.query(`
      SELECT nome, categoria, tamanhos_precos, ingredientes 
      FROM produtos 
      WHERE tipo_produto = 'pizza' AND categoria = 'doce' 
      ORDER BY nome 
      LIMIT 3
    `);
    
    pizzasDoces.rows.forEach(pizza => {
      console.log(`\n📋 ${pizza.nome.toUpperCase()}`);
      console.log(`   Ingredientes: ${pizza.ingredientes}`);
      console.log('   Preços por tamanho:');
      
      if (pizza.tamanhos_precos && Array.isArray(pizza.tamanhos_precos)) {
        pizza.tamanhos_precos.forEach(tamanho => {
          console.log(`     • ${tamanho.tamanho}: R$ ${tamanho.preco.toFixed(2)}`);
        });
      }
    });

    // Verificar bordas
    console.log('\n🥖 BORDAS RECHEADAS:');
    const bordas = await db.query(`
      SELECT nome, preco_unitario 
      FROM produtos 
      WHERE tipo_produto = 'borda' 
      ORDER BY nome 
      LIMIT 5
    `);
    
    bordas.rows.forEach(borda => {
      console.log(`   • ${borda.nome}: R$ ${parseFloat(borda.preco_unitario).toFixed(2)}`);
    });

    // Estatísticas gerais
    console.log('\n📊 ESTATÍSTICAS GERAIS:');
    const stats = await db.query(`
      SELECT 
        tipo_produto,
        categoria,
        COUNT(*) as quantidade
      FROM produtos 
      GROUP BY tipo_produto, categoria 
      ORDER BY tipo_produto, categoria
    `);
    
    stats.rows.forEach(stat => {
      const categoria = stat.categoria ? ` (${stat.categoria})` : '';
      console.log(`   • ${stat.tipo_produto}${categoria}: ${stat.quantidade} produtos`);
    });

    // Verificar se algum produto não tem preços configurados
    console.log('\n🔍 VERIFICAÇÃO DE INTEGRIDADE:');
    const problemaPizzas = await db.query(`
      SELECT nome, tipo_produto, tamanhos_precos, preco_unitario 
      FROM produtos 
      WHERE tipo_produto = 'pizza' AND (tamanhos_precos IS NULL OR tamanhos_precos = '[]'::jsonb)
    `);

    const problemaBordas = await db.query(`
      SELECT nome, tipo_produto, preco_unitario 
      FROM produtos 
      WHERE tipo_produto = 'borda' AND preco_unitario IS NULL
    `);

    if (problemaPizzas.rows.length === 0 && problemaBordas.rows.length === 0) {
      console.log('   ✅ Todos os produtos têm preços configurados corretamente!');
    } else {
      console.log(`   ❌ Encontrados ${problemaPizzas.rows.length} pizzas sem preços`);
      console.log(`   ❌ Encontradas ${problemaBordas.rows.length} bordas sem preços`);
    }

    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verificarPrecos(); 