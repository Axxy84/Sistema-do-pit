const pool = require('./config/database');

async function testPizzas() {
  try {
    console.log('🍕 Testando pizzas do cardápio...\n');

    // 1. Contar total de pizzas
    const countQuery = 'SELECT COUNT(*) as total FROM produtos WHERE tipo_produto = $1';
    const countResult = await pool.query(countQuery, ['pizza']);
    console.log(`📊 Total de pizzas no sistema: ${countResult.rows[0].total}`);

    // 2. Listar todas as pizzas com preços
    console.log('\n📋 Lista completa de pizzas:\n');
    const listQuery = `
      SELECT nome, categoria, tamanhos_precos, ativo
      FROM produtos 
      WHERE tipo_produto = 'pizza' 
      ORDER BY nome
    `;
    const listResult = await pool.query(listQuery);

    if (listResult.rows.length === 0) {
      console.log('   ⚠️  Nenhuma pizza encontrada no sistema!');
      console.log('   Execute primeiro: node populate-pizzas-cardapio.js');
    } else {
      listResult.rows.forEach((pizza, index) => {
        console.log(`${index + 1}. ${pizza.nome} ${pizza.ativo ? '✅' : '❌'}`);
        
        const precos = JSON.parse(pizza.tamanhos_precos);
        console.log('   💰 Preços:');
        precos.forEach(p => {
          console.log(`      ${p.tamanho}: R$ ${parseFloat(p.preco).toFixed(2)}`);
        });
        console.log('');
      });
    }

    // 3. Análise de preços
    console.log('\n💵 Análise de Preços:\n');
    
    // Pizza mais barata (tamanho pequena)
    const cheapestQuery = `
      SELECT nome, 
             (tamanhos_precos->0->>'preco')::decimal as preco_pequena
      FROM produtos 
      WHERE tipo_produto = 'pizza' AND ativo = true
      ORDER BY preco_pequena
      LIMIT 1
    `;
    const cheapest = await pool.query(cheapestQuery);
    if (cheapest.rows.length > 0) {
      console.log(`🏷️  Pizza mais barata (Pequena): ${cheapest.rows[0].nome} - R$ ${parseFloat(cheapest.rows[0].preco_pequena).toFixed(2)}`);
    }

    // Pizza mais cara (tamanho família)
    const expensiveQuery = `
      SELECT nome, 
             (tamanhos_precos->3->>'preco')::decimal as preco_familia
      FROM produtos 
      WHERE tipo_produto = 'pizza' AND ativo = true
      ORDER BY preco_familia DESC
      LIMIT 1
    `;
    const expensive = await pool.query(expensiveQuery);
    if (expensive.rows.length > 0) {
      console.log(`💎 Pizza mais cara (Família): ${expensive.rows[0].nome} - R$ ${parseFloat(expensive.rows[0].preco_familia).toFixed(2)}`);
    }

    // 4. Buscar pizzas específicas
    console.log('\n🔍 Teste de busca:\n');
    
    const searchTerms = ['Calabresa', 'Bacon', 'Camarão'];
    for (const term of searchTerms) {
      const searchQuery = `
        SELECT nome FROM produtos 
        WHERE tipo_produto = 'pizza' 
        AND nome ILIKE $1
      `;
      const searchResult = await pool.query(searchQuery, [`%${term}%`]);
      console.log(`   Pizzas com "${term}": ${searchResult.rows.map(r => r.nome).join(', ')}`);
    }

    // 5. Verificar estrutura JSONB
    console.log('\n🔧 Verificação da estrutura JSONB:\n');
    const structureQuery = `
      SELECT nome, jsonb_array_length(tamanhos_precos) as num_tamanhos
      FROM produtos 
      WHERE tipo_produto = 'pizza' 
      LIMIT 3
    `;
    const structureResult = await pool.query(structureQuery);
    structureResult.rows.forEach(row => {
      console.log(`   ${row.nome}: ${row.num_tamanhos} tamanhos`);
    });

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao testar pizzas:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await pool.end();
  }
}

// Executar o teste
testPizzas();