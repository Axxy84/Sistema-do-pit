const db = require('./config/database');

async function addTestData() {
  try {
    console.log('🌱 Adicionando dados de teste...');
    
    // Adicionar alguns clientes
    await db.query(`
      INSERT INTO clientes (nome, telefone, endereco, created_at) VALUES 
      ('João Silva', '11999999999', 'Rua A, 123', NOW()),
      ('Maria Santos', '11888888888', 'Rua B, 456', NOW()),
      ('Pedro Costa', '11777777777', 'Rua C, 789', NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Clientes adicionados');

    // Adicionar alguns produtos (usando preco_unitario em vez de preco)
    await db.query(`
      INSERT INTO produtos (nome, preco_unitario, tipo_produto, categoria, created_at) VALUES 
      ('Pizza Margherita', 35.90, 'pizza', 'pizzas', NOW()),
      ('Pizza Calabresa', 39.90, 'pizza', 'pizzas', NOW()),
      ('Pizza Portuguesa', 42.90, 'pizza', 'pizzas', NOW()),
      ('Refrigerante 2L', 8.90, 'bebida', 'bebidas', NOW()),
      ('Água Mineral', 3.50, 'bebida', 'bebidas', NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Produtos adicionados');

    // Buscar IDs dos clientes e produtos
    const clientes = await db.query('SELECT id FROM clientes LIMIT 3');
    const produtos = await db.query('SELECT id FROM produtos WHERE tipo_produto = \'pizza\' LIMIT 3');

    if (clientes.rows.length > 0 && produtos.rows.length > 0) {
      // Adicionar alguns pedidos de hoje
      const today = new Date();
      
      for (let i = 0; i < 5; i++) {
        const clienteId = clientes.rows[i % clientes.rows.length].id;
        const produtoId = produtos.rows[i % produtos.rows.length].id;
        const total = (Math.random() * 50 + 30).toFixed(2); // Entre 30 e 80 reais
        
        const pedidoResult = await db.query(`
          INSERT INTO pedidos (cliente_id, total, status_pedido, data_pedido, created_at) 
          VALUES ($1, $2, 'entregue', $3, $3) 
          RETURNING id
        `, [clienteId, total, today]);
        
        const pedidoId = pedidoResult.rows[0].id;
        
        // Adicionar item do pedido
        await db.query(`
          INSERT INTO itens_pedido (pedido_id, produto_id_ref, quantidade, preco_unitario, sabor_registrado) 
          VALUES ($1, $2, 1, $3, 'Pizza Teste ${i + 1}')
        `, [pedidoId, produtoId, total]);
      }
      console.log('✅ Pedidos de teste adicionados');
    }

    // Adicionar alguns pedidos pendentes
    if (clientes.rows.length > 0 && produtos.rows.length > 0) {
      for (let i = 0; i < 3; i++) {
        const clienteId = clientes.rows[i % clientes.rows.length].id;
        const produtoId = produtos.rows[i % produtos.rows.length].id;
        const total = (Math.random() * 50 + 30).toFixed(2);
        
        const pedidoResult = await db.query(`
          INSERT INTO pedidos (cliente_id, total, status_pedido, data_pedido, created_at) 
          VALUES ($1, $2, 'preparando', NOW(), NOW()) 
          RETURNING id
        `, [clienteId, total]);
        
        const pedidoId = pedidoResult.rows[0].id;
        
        await db.query(`
          INSERT INTO itens_pedido (pedido_id, produto_id_ref, quantidade, preco_unitario, sabor_registrado) 
          VALUES ($1, $2, 1, $3, 'Pizza Pendente ${i + 1}')
        `, [pedidoId, produtoId, total]);
      }
      console.log('✅ Pedidos pendentes adicionados');
    }

    console.log('🎉 Dados de teste adicionados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error);
    process.exit(1);
  }
}

addTestData(); 