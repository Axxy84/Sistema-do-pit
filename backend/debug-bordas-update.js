const db = require('./config/database');
const axios = require('axios');

// Função para gerar token JWT válido
const jwt = require('jsonwebtoken');
function generateTestToken() {
  return jwt.sign(
    { 
      userId: '99a62b24-7acd-4bd0-a84c-9ee2164cec26', // ID real do admin
      email: 'admin@pizzaria.com'
    },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '24h' }
  );
}

async function debugBordasUpdate() {
  console.log('\n🔍 DEBUGGING BORDAS UPDATE ISSUE\n');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar bordas no banco
    console.log('\n1️⃣ Verificando bordas no banco de dados:');
    const bordasResult = await db.query(`
      SELECT id, nome, tipo_produto, preco_unitario, ativo 
      FROM produtos 
      WHERE tipo_produto = 'borda'
      ORDER BY nome
    `);
    
    if (bordasResult.rows.length === 0) {
      console.log('❌ Nenhuma borda encontrada no banco!');
      process.exit(1);
    }
    
    console.log(`✅ ${bordasResult.rows.length} bordas encontradas:`);
    bordasResult.rows.forEach(borda => {
      console.log(`   • ${borda.nome}: R$ ${borda.preco_unitario} (ID: ${borda.id})`);
    });
    
    // 2. Pegar a primeira borda para teste
    const testBorda = bordasResult.rows[0];
    console.log(`\n2️⃣ Testando update da borda: ${testBorda.nome}`);
    console.log(`   ID: ${testBorda.id}`);
    console.log(`   Preço atual: R$ ${testBorda.preco_unitario}`);
    
    // 3. Tentar fazer um update via API
    const token = generateTestToken();
    const newPrice = parseFloat(testBorda.preco_unitario) + 1;
    
    console.log(`\n3️⃣ Tentando atualizar preço para: R$ ${newPrice}`);
    
    const updateData = {
      nome: testBorda.nome,
      tipo_produto: 'borda',
      preco_unitario: newPrice,
      ativo: true
    };
    
    console.log('   Dados enviados:', JSON.stringify(updateData, null, 2));
    
    try {
      const response = await axios.put(
        `http://localhost:3001/api/products/${testBorda.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('\n✅ Update bem-sucedido!');
      console.log('   Resposta:', JSON.stringify(response.data, null, 2));
      
      // 4. Verificar se o update foi aplicado no banco
      const updatedResult = await db.query(
        'SELECT nome, preco_unitario FROM produtos WHERE id = $1',
        [testBorda.id]
      );
      
      const updatedBorda = updatedResult.rows[0];
      console.log(`\n4️⃣ Verificando no banco após update:`);
      console.log(`   Nome: ${updatedBorda.nome}`);
      console.log(`   Preço: R$ ${updatedBorda.preco_unitario}`);
      
      if (parseFloat(updatedBorda.preco_unitario) === newPrice) {
        console.log('\n✅ PREÇO ATUALIZADO CORRETAMENTE!');
      } else {
        console.log('\n❌ PREÇO NÃO FOI ATUALIZADO!');
        console.log(`   Esperado: R$ ${newPrice}`);
        console.log(`   Atual: R$ ${updatedBorda.preco_unitario}`);
      }
      
    } catch (apiError) {
      console.error('\n❌ Erro na API:', apiError.response?.data || apiError.message);
      if (apiError.response?.status === 500) {
        console.log('\n💡 Verificando logs do servidor para mais detalhes...');
      }
    }
    
    // 5. Testar update direto no banco para comparar
    console.log('\n5️⃣ Testando update direto no banco:');
    const directPrice = newPrice + 1;
    
    await db.query(
      'UPDATE produtos SET preco_unitario = $1 WHERE id = $2',
      [directPrice, testBorda.id]
    );
    
    const directResult = await db.query(
      'SELECT preco_unitario FROM produtos WHERE id = $1',
      [testBorda.id]
    );
    
    console.log(`   Update direto: R$ ${directResult.rows[0].preco_unitario}`);
    console.log('   ✅ Update direto funcionou!');
    
  } catch (error) {
    console.error('\n❌ Erro geral:', error);
  } finally {
    // db.end() não existe para o pool de conexões
    console.log('\n' + '='.repeat(50));
    process.exit();
  }
}

// Executar
debugBordasUpdate();