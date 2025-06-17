const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

// Middleware de autenticação específico para garçom
const authenticateWaiter = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pizzaria-secret-key');
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1 AND (tipo_usuario = $2 OR tipo_usuario = $3)',
      [decoded.userId, 'garcom', 'admin']
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado - usuário não é garçom' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const waiterLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por IP
  message: 'Muitas requisições, tente novamente em 15 minutos'
});

router.use(waiterLimit);

/**
 * @swagger
 * /api/waiter/tables:
 *   get:
 *     summary: Lista todas as mesas com status atual
 *     tags: [Waiter App]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tables:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       numero_mesa:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [livre, ocupada, reservada]
 *                       pedidos_ativos:
 *                         type: integer
 *                       valor_conta:
 *                         type: number
 *                       tempo_ocupacao:
 *                         type: string
 */
router.get('/tables', authenticateWaiter, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.numero_mesa,
        CASE 
          WHEN COUNT(p.id) = 0 THEN 'livre'
          WHEN COUNT(CASE WHEN p.status_pedido IN ('fechada', 'cancelado') THEN 1 END) = COUNT(p.id) THEN 'livre'
          ELSE 'ocupada'
        END as status,
        COUNT(CASE WHEN p.status_pedido NOT IN ('fechada', 'cancelado') THEN 1 END) as pedidos_ativos,
        COALESCE(SUM(CASE WHEN p.status_pedido NOT IN ('fechada', 'cancelado') THEN p.valor_total END), 0) as valor_conta,
        MIN(p.data_pedido) as inicio_ocupacao
      FROM 
        (SELECT generate_series(1, 20) as numero_mesa) m
      LEFT JOIN pedidos p ON p.numero_mesa = m.numero_mesa 
        AND p.tipo_pedido = 'mesa'
        AND p.status_pedido NOT IN ('fechada', 'cancelado')
      GROUP BY m.numero_mesa
      ORDER BY m.numero_mesa
    `);

    const tables = result.rows.map(row => ({
      ...row,
      tempo_ocupacao: row.inicio_ocupacao ? 
        Math.floor((Date.now() - new Date(row.inicio_ocupacao)) / 60000) + ' min' : null
    }));

    res.json({ tables });
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/waiter/table/{tableNumber}/orders:
 *   get:
 *     summary: Lista pedidos de uma mesa específica
 *     tags: [Waiter App]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableNumber
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedidos da mesa
 */
router.get('/table/:tableNumber/orders', authenticateWaiter, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', ip.id,
            'produto_nome', pr.nome,
            'quantidade', ip.quantidade,
            'preco_unitario', ip.preco_unitario,
            'observacoes', ip.observacoes,
            'sabores', ip.sabores_registrados,
            'borda', ip.borda
          )
        ) as itens
      FROM pedidos p
      LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
      LEFT JOIN produtos pr ON ip.produto_id = pr.id
      WHERE p.numero_mesa = $1 AND p.tipo_pedido = 'mesa'
        AND p.status_pedido NOT IN ('fechada', 'cancelado')
      GROUP BY p.id
      ORDER BY p.data_pedido DESC
    `, [tableNumber]);

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Erro ao buscar pedidos da mesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/waiter/orders:
 *   post:
 *     summary: Criar novo pedido de mesa
 *     tags: [Waiter App]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_mesa:
 *                 type: integer
 *               cliente_nome:
 *                 type: string
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produto_id:
 *                       type: string
 *                     quantidade:
 *                       type: integer
 *                     observacoes:
 *                       type: string
 *                     sabores:
 *                       type: array
 *                     borda:
 *                       type: string
 */
router.post('/orders', authenticateWaiter, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { numero_mesa, cliente_nome, itens, observacoes_gerais } = req.body;

    // Validações
    if (!numero_mesa || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Mesa e itens são obrigatórios' });
    }

    // Calcular valor total
    let valor_total = 0;
    const itensDetalhados = [];

    for (const item of itens) {
      const produtoResult = await client.query(
        'SELECT * FROM produtos WHERE id = $1',
        [item.produto_id]
      );

      if (produtoResult.rows.length === 0) {
        throw new Error(`Produto ${item.produto_id} não encontrado`);
      }

      const produto = produtoResult.rows[0];
      let preco_unitario = produto.preco;

      // Adicionar preço da borda se houver
      if (item.borda) {
        const bordaResult = await client.query(
          'SELECT preco FROM produtos WHERE id = $1 AND tipo_produto = $2',
          [item.borda, 'borda']
        );
        if (bordaResult.rows.length > 0) {
          preco_unitario += bordaResult.rows[0].preco;
        }
      }

      const subtotal = preco_unitario * item.quantidade;
      valor_total += subtotal;

      itensDetalhados.push({
        ...item,
        preco_unitario,
        subtotal
      });
    }

    // Criar pedido
    const orderResult = await client.query(`
      INSERT INTO pedidos (
        tipo_pedido, numero_mesa, cliente_nome, 
        valor_total, status_pedido, observacoes,
        data_pedido, usuario_id
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING *
    `, [
      'mesa', numero_mesa, cliente_nome || `Mesa ${numero_mesa}`,
      valor_total, 'pendente', observacoes_gerais,
      req.user.id
    ]);

    const pedido = orderResult.rows[0];

    // Criar itens do pedido
    for (const item of itensDetalhados) {
      await client.query(`
        INSERT INTO itens_pedido (
          pedido_id, produto_id, quantidade, preco_unitario,
          observacoes, sabores_registrados, borda
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        pedido.id, item.produto_id, item.quantidade, item.preco_unitario,
        item.observacoes, JSON.stringify(item.sabores), item.borda
      ]);
    }

    await client.query('COMMIT');

    // Emitir evento para atualização em tempo real
    if (global.io) {
      global.io.emit('orderCreated', {
        orderId: pedido.id,
        tableNumber: numero_mesa,
        type: 'mesa'
      });
    }

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order: pedido,
      itens: itensDetalhados
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/waiter/orders/{orderId}/status:
 *   patch:
 *     summary: Atualizar status do pedido
 *     tags: [Waiter App]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pendente, preparando, pronto, retirado]
 */
router.patch('/orders/:orderId/status', authenticateWaiter, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pendente', 'preparando', 'pronto', 'retirado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const result = await pool.query(
      'UPDATE pedidos SET status_pedido = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Emitir evento para atualização em tempo real
    if (global.io) {
      global.io.emit('orderStatusChanged', {
        orderId,
        status,
        tableNumber: result.rows[0].numero_mesa
      });
    }

    res.json({
      message: 'Status atualizado com sucesso',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/waiter/table/{tableNumber}/close:
 *   post:
 *     summary: Fechar conta da mesa
 *     tags: [Waiter App]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableNumber
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forma_pagamento:
 *                 type: string
 *                 enum: [dinheiro, cartao, pix]
 *               valor_pago:
 *                 type: number
 *               desconto:
 *                 type: number
 */
router.post('/table/:tableNumber/close', authenticateWaiter, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { tableNumber } = req.params;
    const { forma_pagamento, valor_pago, desconto = 0 } = req.body;

    // Buscar pedidos ativos da mesa
    const ordersResult = await client.query(`
      SELECT * FROM pedidos 
      WHERE numero_mesa = $1 AND tipo_pedido = 'mesa'
        AND status_pedido NOT IN ('fechada', 'cancelado')
    `, [tableNumber]);

    if (ordersResult.rows.length === 0) {
      return res.status(400).json({ error: 'Nenhum pedido ativo encontrado para esta mesa' });
    }

    const valor_total = ordersResult.rows.reduce((sum, order) => sum + parseFloat(order.valor_total), 0);
    const valor_final = valor_total - desconto;

    // Atualizar todos os pedidos para fechada
    await client.query(`
      UPDATE pedidos 
      SET status_pedido = 'fechada', 
          forma_pagamento = $1,
          valor_pago = $2,
          desconto = $3,
          data_fechamento = NOW()
      WHERE numero_mesa = $4 AND tipo_pedido = 'mesa'
        AND status_pedido NOT IN ('fechada', 'cancelado')
    `, [forma_pagamento, valor_pago, desconto, tableNumber]);

    // Registrar transação
    await client.query(`
      INSERT INTO transacoes (
        tipo_transacao, valor, forma_pagamento, 
        descricao, data_transacao, usuario_id
      ) VALUES ($1, $2, $3, $4, NOW(), $5)
    `, [
      'receita', valor_final, forma_pagamento,
      `Fechamento Mesa ${tableNumber}`, req.user.id
    ]);

    await client.query('COMMIT');

    // Emitir evento para atualização em tempo real
    if (global.io) {
      global.io.emit('tableClosed', {
        tableNumber,
        valor_total: valor_final,
        forma_pagamento
      });
    }

    res.json({
      message: 'Mesa fechada com sucesso',
      tableNumber,
      valor_total,
      valor_final,
      forma_pagamento
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao fechar mesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/waiter/menu:
 *   get:
 *     summary: Obter cardápio completo para garçom
 *     tags: [Waiter App]
 *     security:
 *       - bearerAuth: []
 */
router.get('/menu', authenticateWaiter, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, nome, descricao, preco, tipo_produto, 
        tamanhos_disponiveis, ativo, categoria
      FROM produtos 
      WHERE ativo = true
      ORDER BY tipo_produto, categoria, nome
    `);

    const menu = result.rows.reduce((acc, item) => {
      if (!acc[item.tipo_produto]) {
        acc[item.tipo_produto] = [];
      }
      acc[item.tipo_produto].push(item);
      return acc;
    }, {});

    res.json({ menu });
  } catch (error) {
    console.error('Erro ao buscar cardápio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/waiter/notifications:
 *   get:
 *     summary: Obter notificações para o garçom
 *     tags: [Waiter App]
 *     security:
 *       - bearerAuth: []
 */
router.get('/notifications', authenticateWaiter, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.numero_mesa,
        p.status_pedido,
        p.data_pedido,
        EXTRACT(EPOCH FROM (NOW() - p.data_pedido))/60 as minutos_pendente
      FROM pedidos p
      WHERE p.tipo_pedido = 'mesa' 
        AND p.status_pedido IN ('pronto', 'preparando')
      ORDER BY p.data_pedido ASC
    `);

    const notifications = result.rows.map(order => ({
      id: order.id,
      type: order.status_pedido === 'pronto' ? 'ready' : 'preparing',
      message: order.status_pedido === 'pronto' 
        ? `Mesa ${order.numero_mesa} - Pedido pronto para retirada`
        : `Mesa ${order.numero_mesa} - Pedido em preparação há ${Math.floor(order.minutos_pendente)} min`,
      tableNumber: order.numero_mesa,
      priority: order.minutos_pendente > 15 ? 'high' : 'normal',
      timestamp: order.data_pedido
    }));

    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;