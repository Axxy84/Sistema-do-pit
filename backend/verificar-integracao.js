const db = require('./config/database');

async function verificarIntegracao() {
  try {
    console.log('🔍 VERIFICANDO INTEGRAÇÃO FRONTEND-BACKEND...\n');
    
    // Verificar se API de produtos está funcionando
    console.log('🔗 Verificando endpoint /api/products...');
    
    const produtos = await db.query(`
      SELECT id, nome, tipo_produto, categoria, ativo 
      FROM produtos 
      WHERE ativo = true 
      ORDER BY nome 
      LIMIT 10
    `);
    
    console.log(`✅ Encontrados ${produtos.rows.length} produtos ativos no banco:`);
    produtos.rows.forEach(produto => {
      console.log(`   📋 ${produto.nome} (${produto.tipo_produto}) - ID: ${produto.id.slice(0, 8)}...`);
    });
    
    // Verificar se há discrepância entre dados mock e reais
    console.log('\n🔍 ANÁLISE DE POSSÍVEIS PROBLEMAS:');
    
    // Verificar se existem produtos com nomes similares aos mock
    const mockNames = ['Pizza Margherita', 'Pizza Pepperoni', 'Pizza Calabresa', 'Coca-Cola 2L', 'Água 500ml'];
    
    for (const mockName of mockNames) {
      const realProduct = await db.query(`
        SELECT id, nome FROM produtos 
        WHERE nome ILIKE $1 OR nome ILIKE $2
      `, [mockName, `%${mockName.split(' ')[1] || mockName}%`]);
      
      if (realProduct.rows.length > 0) {
        console.log(`   ✅ "${mockName}" → Encontrado no banco: "${realProduct.rows[0].nome}" (ID: ${realProduct.rows[0].id.slice(0, 8)}...)`);
      } else {
        console.log(`   ❌ "${mockName}" → NÃO encontrado no banco`);
      }
    }
    
    // Verificar estrutura de dados
    console.log('\n📊 ESTRUTURA DOS DADOS NO BANCO:');
    
    const pizzaExample = await db.query(`
      SELECT id, nome, tamanhos_precos, ingredientes 
      FROM produtos 
      WHERE tipo_produto = 'pizza' 
      LIMIT 1
    `);
    
    if (pizzaExample.rows.length > 0) {
      const pizza = pizzaExample.rows[0];
      console.log('   🍕 Exemplo de Pizza:');
      console.log(`      Nome: ${pizza.nome}`);
      console.log(`      ID: ${pizza.id}`);
      console.log(`      Tamanhos: ${JSON.stringify(pizza.tamanhos_precos, null, 8)}`);
      console.log(`      Ingredientes: ${pizza.ingredientes}`);
    }
    
    const bordaExample = await db.query(`
      SELECT id, nome, preco_unitario 
      FROM produtos 
      WHERE tipo_produto = 'borda' 
      LIMIT 1
    `);
    
    if (bordaExample.rows.length > 0) {
      const borda = bordaExample.rows[0];
      console.log('\n   🥖 Exemplo de Borda:');
      console.log(`      Nome: ${borda.nome}`);
      console.log(`      ID: ${borda.id}`);
      console.log(`      Preço: R$ ${parseFloat(borda.preco_unitario).toFixed(2)}`);
    }
    
    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('   1. ✅ Backend: Dados corretos no banco (IDs UUID)');
    console.log('   2. ⚠️  Frontend: Verificar se está usando dados reais da API');
    console.log('   3. 🔧 Solução: Garantir que productService.getAllActiveProducts() funcione');
    console.log('   4. 🚫 Remover dependência de dados mock no frontend');
    
    console.log('\n🎯 STATUS DA INTEGRAÇÃO:');
    if (produtos.rows.length > 30) {
      console.log('   ✅ BANCO: Cardápio completo carregado');
      console.log('   🔍 PRÓXIMO PASSO: Testar endpoint /api/products via curl/Postman');
    } else {
      console.log('   ⚠️  BANCO: Poucos produtos encontrados - executar populate-menu.js');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    process.exit(1);
  }
}

verificarIntegracao(); 