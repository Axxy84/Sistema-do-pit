const db = require('./config/database');

async function criarPedidoSimples() {
  try {
    console.log('🔄 Criando pedido simples para teste do app...');
    
    // Buscar primeiro cliente disponível
    const clienteResult = await db.query('SELECT id FROM clientes LIMIT 1');
    let clienteId;
    
    if (clienteResult.rows.length === 0) {
      // Criar cliente de teste
      const novoCliente = await db.query(`
        INSERT INTO clientes (nome, telefone) 
        VALUES ('Cliente App Teste', '11666666666') 
        RETURNING id
      `);
      clienteId = novoCliente.rows[0].id;
      console.log('✅ Cliente de teste criado:', clienteId);
    } else {
      clienteId = clienteResult.rows[0].id;
      console.log('✅ Usando cliente existente:', clienteId);
    }
    
    // Buscar primeiro produto disponível
    const produtoResult = await db.query('SELECT id, nome, preco_unitario FROM produtos WHERE preco_unitario IS NOT NULL LIMIT 1');
    if (produtoResult.rows.length === 0) {
      throw new Error('Nenhum produto encontrado');
    }
    
    const produto = produtoResult.rows[0];
    console.log('✅ Produto encontrado:', produto.nome, 'R$', produto.preco_unitario);
    
    // Criar pedido de delivery
    const pedidoResult = await db.query(`
      INSERT INTO pedidos (
        cliente_id, 
        tipo_pedido, 
        status_pedido, 
        total, 
        endereco_entrega,
        taxa_entrega,
        forma_pagamento,
        observacoes
      ) VALUES ($1, 'delivery', 'preparando', $2, $3, 5.00, 'dinheiro', 'Pedido criado para teste do app')
      RETURNING id
    `, [
      clienteId, 
      parseFloat(produto.preco_unitario) + 5.00, // produto + taxa entrega
      'Rua Teste App, 123 - Centro'
    ]);
    
    const pedidoId = pedidoResult.rows[0].id;
    console.log('✅ Pedido criado com ID:', pedidoId);
    
    // Adicionar item ao pedido
    await db.query(`
      INSERT INTO itens_pedido (
        pedido_id, 
        produto_id_ref, 
        quantidade, 
        valor_unitario
      ) VALUES ($1, $2, 1, $3)
    `, [pedidoId, produto.id, produto.preco_unitario]);
    
    console.log('✅ Item adicionado ao pedido');
    
    console.log('\n📱 PEDIDO CRIADO PARA TESTE DO APP:');
    console.log('=================================');
    console.log('ID do Pedido:', pedidoId);
    console.log('Status:', 'preparando');
    console.log('Tipo:', 'delivery');
    console.log('Total: R$', (parseFloat(produto.preco_unitario) + 5.00).toFixed(2));
    console.log('Endereço:', 'Rua Teste App, 123 - Centro');
    console.log('\n🎯 Este pedido aparecerá no app como "Disponível"');
    console.log('📱 Use as credenciais:');
    console.log('   Telefone: 11999999999');
    console.log('   Senha: 123456');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit(0);
  }
}

criarPedidoSimples();