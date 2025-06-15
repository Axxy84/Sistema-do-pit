// Script para testar o update de bordas simulando o frontend
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
// Token válido gerado pelo sistema
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NTAwMTg5MTMsImV4cCI6MTc1MDEwNTMxM30.puYHG886bxeHnS8kUhEMP9t5_-am34So1-gxoAeN9gA';

async function testBordaUpdateFlow() {
  console.log('\n🧪 TESTE DO FLUXO DE UPDATE DE BORDAS (FRONTEND SIMULATION)\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Buscar produtos (como o frontend faz)
    console.log('\n1️⃣ Buscando produtos da API...');
    const getResponse = await axios.get(`${API_URL}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const produtos = getResponse.data.products;
    const bordas = produtos.filter(p => p.tipo_produto === 'borda');
    
    console.log(`✅ ${bordas.length} bordas encontradas`);
    
    if (bordas.length === 0) {
      console.log('❌ Nenhuma borda encontrada!');
      return;
    }
    
    // 2. Pegar primeira borda para editar
    const bordaParaEditar = bordas[0];
    console.log(`\n2️⃣ Editando borda: ${bordaParaEditar.nome}`);
    console.log(`   ID: ${bordaParaEditar.id}`);
    console.log(`   Preço atual: R$ ${bordaParaEditar.preco_unitario}`);
    console.log(`   Tipo de preco_unitario: ${typeof bordaParaEditar.preco_unitario}`);
    
    // 3. Simular edição no frontend
    const novoPreco = parseFloat(bordaParaEditar.preco_unitario) + 0.50;
    console.log(`\n3️⃣ Simulando edição no formulário:`);
    console.log(`   Novo preço: R$ ${novoPreco}`);
    
    // 4. Preparar dados como o frontend faria
    const dadosParaSalvar = {
      nome: bordaParaEditar.nome,
      tipo_produto: 'borda',
      categoria: bordaParaEditar.categoria,
      tamanhos_precos: null, // bordas não têm tamanhos
      ingredientes: null, // bordas não têm ingredientes
      preco_unitario: novoPreco, // Este é o campo importante!
      estoque_disponivel: null, // bordas não têm estoque
      ativo: true
    };
    
    console.log('\n4️⃣ Dados que serão enviados:');
    console.log(JSON.stringify(dadosParaSalvar, null, 2));
    
    // 5. Enviar update via API
    console.log(`\n5️⃣ Enviando PUT para /api/products/${bordaParaEditar.id}...`);
    
    const updateResponse = await axios.put(
      `${API_URL}/products/${bordaParaEditar.id}`,
      dadosParaSalvar,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Update realizado com sucesso!');
    const produtoAtualizado = updateResponse.data.product;
    console.log(`   Nome: ${produtoAtualizado.nome}`);
    console.log(`   Preço retornado: R$ ${produtoAtualizado.preco_unitario}`);
    console.log(`   Tipo de preco_unitario: ${typeof produtoAtualizado.preco_unitario}`);
    
    // 6. Buscar novamente para confirmar
    console.log('\n6️⃣ Buscando produto novamente para confirmar...');
    const confirmResponse = await axios.get(
      `${API_URL}/products/${bordaParaEditar.id}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const produtoConfirmado = confirmResponse.data.product;
    console.log(`   Preço confirmado: R$ ${produtoConfirmado.preco_unitario}`);
    
    // 7. Verificar se o preço foi atualizado corretamente
    const precoEsperado = novoPreco;
    const precoAtual = parseFloat(produtoConfirmado.preco_unitario);
    
    if (Math.abs(precoAtual - precoEsperado) < 0.01) {
      console.log('\n✅ SUCESSO: Preço foi atualizado corretamente!');
    } else {
      console.log('\n❌ ERRO: Preço não foi atualizado corretamente!');
      console.log(`   Esperado: R$ ${precoEsperado}`);
      console.log(`   Atual: R$ ${precoAtual}`);
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.response?.data || error.message);
    if (error.response) {
      console.log('\nDetalhes do erro:');
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Executar teste
testBordaUpdateFlow();