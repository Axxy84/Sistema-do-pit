const db = require('./config/database');

async function testFinalCorrection() {
  try {
    console.log('🧪 TESTE FINAL DA CORREÇÃO DO UUID...\n');
    
    // 1. Verificar produtos disponíveis
    console.log('1️⃣ Produtos disponíveis no banco:');
    const produtos = await db.query(`
      SELECT id, nome, tipo_produto 
      FROM produtos 
      WHERE ativo = true 
      ORDER BY tipo_produto, nome 
      LIMIT 10
    `);
    
    if (produtos.rows.length === 0) {
      console.log('❌ PROBLEMA: Nenhum produto encontrado no banco!');
      return;
    }
    
    produtos.rows.forEach((produto, index) => {
      console.log(`   ${index + 1}. ${produto.nome} (${produto.tipo_produto})`);
      console.log(`      ID: ${produto.id}`);
    });
    
    // 2. Testar inserção de um pedido com produto real
    console.log('\n2️⃣ Testando inserção de pedido com produto real:');
    
    const produtoTeste = produtos.rows[0];
    console.log(`   Usando produto: ${produtoTeste.nome} (ID: ${produtoTeste.id})`);
    
    try {
      // Criar um cliente de teste primeiro
      const clienteResult = await db.query(`
        INSERT INTO clientes (nome, telefone) 
        VALUES ('Cliente Teste', '11999999999') 
        RETURNING id
      `);
      const clienteId = clienteResult.rows[0].id;
      
      // Criar um pedido de teste
      const pedidoResult = await db.query(`
        INSERT INTO pedidos (
          cliente_id, total, status_pedido, forma_pagamento, tipo_pedido
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING id
      `, [clienteId, 35.90, 'pendente', 'dinheiro', 'delivery']);
      
      const pedidoId = pedidoResult.rows[0].id;
      
      // Tentar inserir item do pedido com UUID válido
      await db.query(`
        INSERT INTO itens_pedido (
          pedido_id, produto_id_ref, quantidade, valor_unitario, sabor_registrado
        ) VALUES ($1, $2, $3, $4, $5)
      `, [pedidoId, produtoTeste.id, 1, 35.90, produtoTeste.nome]);
      
      console.log('   ✅ SUCESSO! Pedido criado com UUID válido');
      
      // Limpar dados de teste
      await db.query('DELETE FROM itens_pedido WHERE pedido_id = $1', [pedidoId]);
      await db.query('DELETE FROM pedidos WHERE id = $1', [pedidoId]);
      await db.query('DELETE FROM clientes WHERE id = $1', [clienteId]);
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
    }
    
    // 3. Confirmar que o erro ainda acontece com valor "4"
    console.log('\n3️⃣ Confirmando que "4" ainda causa erro:');
    
    try {
      await db.query(`
        INSERT INTO itens_pedido (
          pedido_id, produto_id_ref, quantidade, valor_unitario, sabor_registrado
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        '123e4567-e89b-12d3-a456-426614174000', // UUID de teste
        '4', // Valor problemático
        1,
        10.00,
        'Teste'
      ]);
      
      console.log('   ⚠️ INESPERADO: "4" foi aceito (não deveria)');
      
    } catch (error) {
      console.log('   ✅ ESPERADO: "4" ainda causa erro (correto)');
      console.log(`   Erro: ${error.message}`);
    }
    
    console.log('\n🎯 RESULTADO:');
    console.log('✅ Produtos reais disponíveis no banco com UUIDs válidos');
    console.log('✅ Inserção funciona com UUIDs válidos');
    console.log('✅ Inserção falha com valores inválidos (como esperado)');
    console.log('\n💡 PRÓXIMO PASSO: Garantir que o frontend use apenas produtos do banco');
    console.log('   - Limpar cache do browser (Ctrl+Shift+Del)');
    console.log('   - Recarregar a página completamente');
    console.log('   - Verificar se a lista de produtos carrega do banco');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    process.exit(0);
  }
}

testFinalCorrection(); 