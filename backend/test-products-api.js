const axios = require('axios');

async function testProductsAPI() {
  try {
    console.log('🧪 TESTANDO API DE PRODUTOS...\n');
    
    const response = await axios.get('http://localhost:3001/api/products', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYzE3Y2QwYi04ZDRiLTQzYzYtODNmYi02NGFlYjU5ZWI0YWEiLCJpYXQiOjE3NDk4MjE2NzEsImV4cCI6MTc0OTkwODA3MX0.vNHLDBhpHrAXEcOhfMYNnU_A1tIo_z6bT29W7Q5rJi0',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Total de produtos:', response.data.products?.length || 0);
    
    if (response.data.products && response.data.products.length > 0) {
      console.log('\n🍕 EXEMPLOS DE PRODUTOS:');
      
      // Mostrar algumas pizzas
      const pizzas = response.data.products.filter(p => p.tipo_produto === 'pizza').slice(0, 3);
      pizzas.forEach(pizza => {
        console.log(`   📋 ${pizza.nome} (ID: ${pizza.id.slice(0, 8)}...)`);
        console.log(`      Tamanhos: ${pizza.tamanhos_precos?.length || 0} opções`);
        if (pizza.tamanhos_precos && pizza.tamanhos_precos.length > 0) {
          pizza.tamanhos_precos.forEach(tp => {
            console.log(`        • ${tp.tamanho}: R$ ${tp.preco}`);
          });
        }
        console.log('');
      });
      
      // Mostrar bordas
      const bordas = response.data.products.filter(p => p.tipo_produto === 'borda').slice(0, 3);
      if (bordas.length > 0) {
        console.log('🥖 BORDAS:');
        bordas.forEach(borda => {
          console.log(`   📋 ${borda.nome}: R$ ${borda.preco_unitario} (ID: ${borda.id.slice(0, 8)}...)`);
        });
      }
      
      console.log('\n✅ API FUNCIONANDO CORRETAMENTE!');
      console.log('🎯 Próximo passo: Frontend deve usar estes dados reais');
      
    } else {
      console.log('⚠️ API retornou array vazio');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 SOLUÇÃO: Servidor backend não está rodando');
      console.log('   Execute: npm start (ou node server.js)');
    } else if (error.response) {
      console.log('📊 Status HTTP:', error.response.status);
      console.log('📄 Resposta:', error.response.data);
    }
  }
}

testProductsAPI(); 