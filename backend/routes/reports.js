const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/reports/fechamentos - Buscar fechamentos por período
router.post('/fechamentos', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.body;

    const result = await db.query(`
      SELECT 
        fc.*,
        (
          SELECT COUNT(DISTINCT p.id) 
          FROM pedidos p 
          WHERE DATE(p.data_pedido) = fc.data_fechamento
        ) as total_pedidos_calculado
      FROM fechamento_caixa fc
      WHERE fc.data_fechamento BETWEEN $1 AND $2
      ORDER BY fc.data_fechamento DESC
    `, [data_inicio, data_fim]);

    res.json({ fechamentos: result.rows });
  } catch (error) {
    console.error('Erro ao buscar fechamentos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/reports/sales - Relatório de vendas
router.post('/sales', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    // Total de vendas por dia
    const salesByDay = await db.query(`
      SELECT 
        DATE(data_pedido) as data,
        COUNT(*) as total_pedidos,
        SUM(total) as total_vendas,
        AVG(total) as ticket_medio
      FROM pedidos
      WHERE data_pedido BETWEEN $1 AND $2
        AND status_pedido != 'cancelado'
      GROUP BY DATE(data_pedido)
      ORDER BY data
    `, [start_date, end_date]);

    // Vendas por forma de pagamento
    const salesByPayment = await db.query(`
      SELECT 
        forma_pagamento,
        COUNT(*) as quantidade,
        SUM(total) as total
      FROM pedidos
      WHERE data_pedido BETWEEN $1 AND $2
        AND status_pedido != 'cancelado'
      GROUP BY forma_pagamento
    `, [start_date, end_date]);

    // Vendas por tipo de pedido
    const salesByType = await db.query(`
      SELECT 
        tipo_pedido,
        COUNT(*) as quantidade,
        SUM(total) as total
      FROM pedidos
      WHERE data_pedido BETWEEN $1 AND $2
        AND status_pedido != 'cancelado'
      GROUP BY tipo_pedido
    `, [start_date, end_date]);

    res.json({ 
      report: {
        salesByDay: salesByDay.rows,
        salesByPayment: salesByPayment.rows,
        salesByType: salesByType.rows
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/reports/top-products - Produtos mais vendidos
router.post('/top-products', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.body;

    const result = await db.query(`
      SELECT 
        COALESCE(ip.sabor_registrado, pr.nome) as produto_nome,
        pr.tipo_produto,
        SUM(ip.quantidade) as quantidade_vendida,
        SUM(ip.quantidade * ip.valor_unitario) as total_vendas
      FROM itens_pedido ip
      JOIN pedidos p ON ip.pedido_id = p.id
      LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
      WHERE p.data_pedido BETWEEN $1 AND $2
        AND p.status_pedido != 'cancelado'
      GROUP BY produto_nome, pr.tipo_produto
      ORDER BY quantidade_vendida DESC
      LIMIT $3
    `, [start_date, end_date, limit]);

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/reports/customers - Relatório de clientes
router.post('/customers', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    // Top clientes por valor gasto
    const topCustomers = await db.query(`
      SELECT 
        c.id,
        c.nome,
        c.telefone,
        COUNT(p.id) as total_pedidos,
        SUM(p.total) as total_gasto,
        AVG(p.total) as ticket_medio,
        SUM(p.pontos_ganhos) as pontos_ganhos_total,
        SUM(p.pontos_resgatados) as pontos_resgatados_total
      FROM clientes c
      JOIN pedidos p ON c.id = p.cliente_id
      WHERE p.data_pedido BETWEEN $1 AND $2
        AND p.status_pedido != 'cancelado'
      GROUP BY c.id, c.nome, c.telefone
      ORDER BY total_gasto DESC
      LIMIT 20
    `, [start_date, end_date]);

    // Novos clientes no período
    const newCustomers = await db.query(`
      SELECT COUNT(*) as total
      FROM clientes
      WHERE created_at BETWEEN $1 AND $2
    `, [start_date, end_date]);

    res.json({ 
      report: {
        topCustomers: topCustomers.rows,
        newCustomersCount: newCustomers.rows[0].total
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 