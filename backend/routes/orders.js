const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders - Listar todos os pedidos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, data_inicio, data_fim, cliente_id } = req.query;
    
    let query = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        e.nome as entregador_nome,
        e.telefone as entregador_telefone,
        cp.codigo as cupom_codigo,
        cp.tipo_desconto as cupom_tipo,
        cp.valor_desconto as cupom_valor
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN entregadores e ON p.entregador_id = e.id
      LEFT JOIN cupons cp ON p.cupom_id = cp.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status_pedido = $${paramIndex++}`;
      params.push(status);
    }

    if (data_inicio) {
      query += ` AND p.data_pedido >= $${paramIndex++}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND p.data_pedido <= $${paramIndex++}`;
      params.push(data_fim);
    }

    if (cliente_id) {
      query += ` AND p.cliente_id = $${paramIndex++}`;
      params.push(cliente_id);
    }

    query += ' ORDER BY p.data_pedido DESC, p.created_at DESC';

    const ordersResult = await db.query(query, params);
    
    // Buscar itens de cada pedido
    const ordersWithItems = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await db.query(`
          SELECT 
            ip.*,
            pr.nome as produto_nome,
            pr.tipo_produto,
            pr.categoria
          FROM itens_pedido ip
          LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
          WHERE ip.pedido_id = $1
          ORDER BY ip.created_at
        `, [order.id]);

        return {
          ...order,
          itens_pedido: itemsResult.rows,
          cliente_id: order.cliente_id ? {
            id: order.cliente_id,
            nome: order.cliente_nome,
            telefone: order.cliente_telefone,
            endereco: order.cliente_endereco
          } : null,
          entregador_id: order.entregador_id ? {
            id: order.entregador_id,
            nome: order.entregador_nome,
            telefone: order.entregador_telefone
          } : null,
          cupom_id_data: order.cupom_id ? {
            id: order.cupom_id,
            codigo: order.cupom_codigo,
            tipo_desconto: order.cupom_tipo,
            valor_desconto: order.cupom_valor
          } : null
        };
      })
    );

    res.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/orders/:id - Buscar pedido por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await db.query(`
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        e.nome as entregador_nome,
        e.telefone as entregador_telefone,
        cp.codigo as cupom_codigo,
        cp.tipo_desconto as cupom_tipo,
        cp.valor_desconto as cupom_valor
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN entregadores e ON p.entregador_id = e.id
      LEFT JOIN cupons cp ON p.cupom_id = cp.id
      WHERE p.id = $1
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = orderResult.rows[0];

    // Buscar itens do pedido
    const itemsResult = await db.query(`
      SELECT 
        ip.*,
        pr.nome as produto_nome,
        pr.tipo_produto,
        pr.categoria
      FROM itens_pedido ip
      LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
      WHERE ip.pedido_id = $1
      ORDER BY ip.created_at
    `, [id]);

    const orderWithItems = {
      ...order,
      itens_pedido: itemsResult.rows,
      cliente_id: order.cliente_id ? {
        id: order.cliente_id,
        nome: order.cliente_nome,
        telefone: order.cliente_telefone,
        endereco: order.cliente_endereco
      } : null,
      entregador_id: order.entregador_id ? {
        id: order.entregador_id,
        nome: order.entregador_nome,
        telefone: order.entregador_telefone
      } : null,
      cupom_id_data: order.cupom_id ? {
        id: order.cupom_id,
        codigo: order.cupom_codigo,
        tipo_desconto: order.cupom_tipo,
        valor_desconto: order.cupom_valor
      } : null
    };
    
    res.json({ order: orderWithItems });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/orders - Criar novo pedido
router.post('/', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { 
      cliente_id,
      entregador_id,
      total,
      forma_pagamento,
      valor_pago,
      troco_calculado,
      cupom_id,
      desconto_aplicado = 0,
      pontos_ganhos = 0,
      pontos_resgatados = 0,
      observacoes,
      items = []
    } = req.body;

    // Validações básicas
    if (!total || items.length === 0) {
      throw new Error('Total e itens são obrigatórios');
    }

    // Criar o pedido
    const orderResult = await client.query(`
      INSERT INTO pedidos (
        cliente_id, entregador_id, total, forma_pagamento, valor_pago,
        troco_calculado, cupom_id, desconto_aplicado, pontos_ganhos,
        pontos_resgatados, observacoes, status_pedido
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      cliente_id, entregador_id, parseFloat(total), forma_pagamento,
      valor_pago ? parseFloat(valor_pago) : null,
      troco_calculado ? parseFloat(troco_calculado) : null,
      cupom_id, parseFloat(desconto_aplicado),
      parseInt(pontos_ganhos), parseInt(pontos_resgatados),
      observacoes, 'pendente'
    ]);

    const savedOrder = orderResult.rows[0];

    // Criar itens do pedido
    const itemsToSave = items.map(item => [
      savedOrder.id,
      item.produto_id_ref || null,
      item.sabor_registrado || null,
      item.tamanho_registrado || null,
      parseInt(item.quantidade),
      parseFloat(item.valor_unitario)
    ]);

    for (const itemData of itemsToSave) {
      await client.query(`
        INSERT INTO itens_pedido (
          pedido_id, produto_id_ref, sabor_registrado, 
          tamanho_registrado, quantidade, valor_unitario
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, itemData);
    }

    // Incrementar uso do cupom se aplicável
    if (cupom_id) {
      await client.query(`
        UPDATE cupons 
        SET usos_atuais = usos_atuais + 1, updated_at = NOW()
        WHERE id = $1
      `, [cupom_id]);
    }

    // Atualizar pontos do cliente se aplicável
    if (cliente_id && (pontos_ganhos > 0 || pontos_resgatados > 0)) {
      // Note: Assumindo que pontos são calculados diretamente dos pedidos
      // Se houver tabela separada de pontos, implementar aqui
    }

    await client.query('COMMIT');
    
    // Buscar pedido completo para retornar
    const completeOrderResult = await db.query(`
      SELECT 
        p.*,
        c.nome as cliente_nome,
        e.nome as entregador_nome
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN entregadores e ON p.entregador_id = e.id
      WHERE p.id = $1
    `, [savedOrder.id]);

    res.status(201).json({ order: completeOrderResult.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status - Atualizar status do pedido
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status_pedido } = req.body;

    const validStatuses = ['pendente', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado'];
    
    if (!validStatuses.includes(status_pedido)) {
      return res.status(400).json({ 
        error: 'Status inválido',
        message: `Status deve ser um dos: ${validStatuses.join(', ')}` 
      });
    }

    const result = await db.query(`
      UPDATE pedidos 
      SET status_pedido = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status_pedido, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json({ order: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/orders/:id - Deletar pedido
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Verificar se pedido existe
    const existingOrder = await client.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = existingOrder.rows[0];

    // Deletar itens do pedido primeiro
    await client.query('DELETE FROM itens_pedido WHERE pedido_id = $1', [id]);

    // Reverter uso do cupom se aplicável
    if (order.cupom_id) {
      await client.query(`
        UPDATE cupons 
        SET usos_atuais = GREATEST(0, usos_atuais - 1), updated_at = NOW()
        WHERE id = $1
      `, [order.cupom_id]);
    }

    // Deletar o pedido
    await client.query('DELETE FROM pedidos WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Pedido removido com sucesso' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

module.exports = router; 