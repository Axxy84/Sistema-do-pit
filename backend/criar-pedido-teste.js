/**
 * Script para criar um pedido de teste no banco de dados
 */

const db = require('./config/database');

async function criarPedidoTeste() {
  console.log('='.repeat(50));
  console.log('CRIANDO PEDIDO DE TESTE');
  console.log('='.repeat(50));

  try {
    // Verificar se já existe um cliente de teste
    const clienteCheckResult = await db.query(`
      SELECT id FROM clientes WHERE telefone = '99999-9999' LIMIT 1
    `);
    
    let clienteId;
    if (clienteCheckResult.rows.length > 0) {
      clienteId = clienteCheckResult.rows[0].id;
      console.log(`✅ Cliente de teste já existe com ID: ${clienteId}`);
    } else {
      // Criar um cliente de teste
      const clienteResult = await db.query(`
        INSERT INTO clientes (nome, telefone, endereco, created_at)
        VALUES ('Cliente Teste', '99999-9999', 'Rua de Teste, 123', NOW())
        RETURNING id
      `);
      clienteId = clienteResult.rows[0].id;
      console.log(`✅ Cliente de teste criado com ID: ${clienteId}`);
    }

    // Criar um pedido de teste
    const hoje = new Date();
    const pedidoResult = await db.query(`
      INSERT INTO pedidos (
        cliente_id, data_pedido, status_pedido, tipo_pedido, 
        total, observacoes, created_at, forma_pagamento, valor_pago,
        endereco_entrega
      )
      VALUES (
        $1, $2, 'entregue', 'delivery',
        100.00, 'Pedido de teste para dashboard', NOW(), 'dinheiro', 100.00,
        'Rua de Teste, 123 - Para entrega'
      )
      RETURNING id
    `, [clienteId, hoje]);
    const pedidoId = pedidoResult.rows[0].id;
    console.log(`✅ Pedido de teste criado com ID: ${pedidoId}`);

    // Buscar um produto de pizza para o item do pedido
    const produtoResult = await db.query(`
      SELECT id FROM produtos WHERE tipo_produto = 'pizza' LIMIT 1
    `);
    
    let produtoId;
    if (produtoResult.rows.length === 0) {
      // Se não encontrar pizza, criar um produto de teste
      const novoProdutoResult = await db.query(`
        INSERT INTO produtos (nome, preco, descricao, tipo_produto)
        VALUES ('Pizza Teste', 50.00, 'Pizza criada para teste', 'pizza')
        RETURNING id
      `);
      produtoId = novoProdutoResult.rows[0].id;
      console.log(`✅ Produto de teste criado com ID: ${produtoId}`);
    } else {
      produtoId = produtoResult.rows[0].id;
      console.log(`✅ Usando produto existente com ID: ${produtoId}`);
    }

    // Adicionar item ao pedido
    await db.query(`
      INSERT INTO itens_pedido (
        pedido_id, produto_id_ref, sabor_registrado, quantidade, 
        valor_unitario, created_at
      )
      VALUES (
        $1, $2, 'Pizza Calabresa', 2,
        50.00, NOW()
      )
    `, [pedidoId, produtoId]);
    console.log(`✅ Item adicionado ao pedido`);

    // Adicionar registro de fechamento de caixa para o dia
    const fechamentoResult = await db.query(`
      INSERT INTO fechamento_caixa (
        data_fechamento, valor_total, observacoes, status, created_at
      )
      VALUES (
        $1, 100.00, 'Fechamento de caixa automático para teste', 'fechado', NOW()
      )
      RETURNING id
    `, [hoje]);
    console.log(`✅ Fechamento de caixa criado com ID: ${fechamentoResult.rows[0].id}`);

    console.log('\n✅ Pedido de teste criado com sucesso!');
    console.log('Agora você pode verificar o dashboard para ver se os dados aparecem.');
    
    // Limpar o cache do dashboard
    console.log('\n🧹 Limpando cache do dashboard...');
    const cache = require('./cache/cache-manager');
    const { CacheKeys } = require('./cache/cache-keys');
    cache.deletePattern(CacheKeys.PATTERNS.DASHBOARD);
    console.log('✅ Cache do dashboard limpo com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar pedido de teste:', error);
  }
}

// Executar a função principal
criarPedidoTeste(); 