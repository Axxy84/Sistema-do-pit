const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const cache = require('../cache/cache-manager');
const { CacheKeys, getPeriodKey } = require('../cache/cache-keys');

const router = express.Router();

// POST /api/reports/fechamentos - Buscar fechamentos por período
router.post('/fechamentos', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.body;
    const periodKey = getPeriodKey(data_inicio, data_fim);
    const cacheKey = CacheKeys.REPORTS_FECHAMENTOS(data_inicio || 'all', data_fim || 'all');

    // Implementação Cache-Aside
    const fechamentos = await cache.getOrFetch(cacheKey, async () => {
      const result = await db.query(`
        SELECT 
          fc.*,
          TO_CHAR(fc.data_fechamento, 'YYYY-MM-DD') as data_fechamento_formatted,
          COALESCE(fc.total_pedidos_dia, 0) as total_pedidos_dia,
          (
            SELECT COUNT(DISTINCT p.id) 
            FROM pedidos p 
            WHERE DATE(COALESCE(p.data_pedido, p.created_at)) = fc.data_fechamento
            AND p.status_pedido = 'entregue'
          ) as total_pedidos_calculado
        FROM fechamento_caixa fc
        WHERE fc.data_fechamento BETWEEN $1 AND $2
        ORDER BY fc.data_fechamento DESC
      `, [data_inicio, data_fim]);

      return result.rows;
    }, 900); // Cache por 15 minutos (dados históricos mudam pouco)

    res.json({ fechamentos });
  } catch (error) {
    console.error('Erro ao buscar fechamentos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/reports/sales - Relatório de vendas com separação por tipo
router.post('/sales', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const cacheKey = CacheKeys.REPORTS_SALES(start_date, end_date);

    // Implementação Cache-Aside para relatório completo de vendas
    const report = await cache.getOrFetch(cacheKey, async () => {
      // Executa todas as consultas em paralelo para melhor performance
      const [salesByDayResult, salesByPaymentResult, salesByTypeResult, salesByDeliveryTypeResult] = await Promise.all([
        // Total de vendas por dia
        db.query(`
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
        `, [start_date, end_date]),

        // Vendas por forma de pagamento
        db.query(`
          SELECT 
            forma_pagamento,
            COUNT(*) as quantidade,
            SUM(total) as total
          FROM pedidos
          WHERE data_pedido BETWEEN $1 AND $2
            AND status_pedido != 'cancelado'
          GROUP BY forma_pagamento
        `, [start_date, end_date]),

        // Vendas por tipo de pedido (mesa/delivery)
        db.query(`
          SELECT 
            tipo_pedido,
            COUNT(*) as quantidade,
            SUM(total) as total,
            AVG(total) as ticket_medio,
            SUM(taxa_entrega) as total_taxas_entrega
          FROM pedidos
          WHERE data_pedido BETWEEN $1 AND $2
            AND status_pedido != 'cancelado'
          GROUP BY tipo_pedido
        `, [start_date, end_date]),

        // Vendas detalhadas por tipo com breakdown diário
        db.query(`
          SELECT 
            DATE(data_pedido) as data,
            tipo_pedido,
            COUNT(*) as quantidade_pedidos,
            SUM(total) as total_vendas,
            AVG(total) as ticket_medio,
            SUM(taxa_entrega) as total_taxas_entrega,
            SUM(desconto_aplicado) as total_descontos
          FROM pedidos
          WHERE data_pedido BETWEEN $1 AND $2
            AND status_pedido != 'cancelado'
          GROUP BY DATE(data_pedido), tipo_pedido
          ORDER BY data, tipo_pedido
        `, [start_date, end_date])
      ]);

      return {
        salesByDay: salesByDayResult.rows,
        salesByPayment: salesByPaymentResult.rows,
        salesByType: salesByTypeResult.rows,
        salesByDeliveryType: salesByDeliveryTypeResult.rows // Novo: breakdown detalhado
      };
    }, 600); // Cache por 10 minutos

    res.json({ report });
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/reports/top-products - Produtos mais vendidos com separação por tipo
router.post('/top-products', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, limit = 10, tipo_pedido } = req.body;
    const cacheKey = CacheKeys.REPORTS_TOP_PRODUCTS(start_date, end_date, `${limit}_${tipo_pedido || 'all'}`);

    // Implementação Cache-Aside
    const products = await cache.getOrFetch(cacheKey, async () => {
      let whereClause = `
        WHERE p.data_pedido BETWEEN $1 AND $2
          AND p.status_pedido != 'cancelado'
      `;
      const params = [start_date, end_date];
      
      // Filtrar por tipo de pedido se especificado
      if (tipo_pedido && ['mesa', 'delivery'].includes(tipo_pedido)) {
        whereClause += ` AND p.tipo_pedido = $3`;
        params.push(tipo_pedido);
      }

      const result = await db.query(`
        SELECT 
          COALESCE(ip.sabor_registrado, pr.nome) as produto_nome,
          pr.tipo_produto,
          p.tipo_pedido,
          SUM(ip.quantidade) as quantidade_vendida,
          SUM(ip.quantidade * ip.valor_unitario) as total_vendas,
          COUNT(DISTINCT p.id) as pedidos_diferentes
        FROM itens_pedido ip
        JOIN pedidos p ON ip.pedido_id = p.id
        LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
        ${whereClause}
        GROUP BY produto_nome, pr.tipo_produto, p.tipo_pedido
        ORDER BY quantidade_vendida DESC
        LIMIT $${params.length + 1}
      `, [...params, limit]);

      return result.rows;
    }, 900); // Cache por 15 minutos (análises históricas são estáveis)

    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/reports/customers - Relatório de clientes com separação por tipo
router.post('/customers', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const cacheKey = CacheKeys.REPORTS_CUSTOMERS(start_date, end_date);

    // Implementação Cache-Aside para relatório de clientes
    const report = await cache.getOrFetch(cacheKey, async () => {
      // Executa consultas em paralelo
      const [topCustomersResult, newCustomersResult, customersByTypeResult] = await Promise.all([
        // Top clientes por valor gasto
        db.query(`
          SELECT 
            c.id,
            c.nome,
            c.telefone,
            COUNT(p.id) as total_pedidos,
            SUM(p.total) as total_gasto,
            AVG(p.total) as ticket_medio,
            SUM(p.pontos_ganhos) as pontos_ganhos_total,
            SUM(p.pontos_resgatados) as pontos_resgatados_total,
            COUNT(CASE WHEN p.tipo_pedido = 'delivery' THEN 1 END) as pedidos_delivery,
            COUNT(CASE WHEN p.tipo_pedido = 'mesa' THEN 1 END) as pedidos_mesa,
            SUM(CASE WHEN p.tipo_pedido = 'delivery' THEN p.total ELSE 0 END) as valor_delivery,
            SUM(CASE WHEN p.tipo_pedido = 'mesa' THEN p.total ELSE 0 END) as valor_mesa
          FROM clientes c
          JOIN pedidos p ON c.id = p.cliente_id
          WHERE p.data_pedido BETWEEN $1 AND $2
            AND p.status_pedido != 'cancelado'
          GROUP BY c.id, c.nome, c.telefone
          ORDER BY total_gasto DESC
          LIMIT 20
        `, [start_date, end_date]),

        // Novos clientes no período
        db.query(`
          SELECT COUNT(*) as total
          FROM clientes
          WHERE created_at BETWEEN $1 AND $2
        `, [start_date, end_date]),

        // Clientes por tipo de pedido preferido
        db.query(`
          SELECT 
            c.nome,
            c.telefone,
            p.tipo_pedido,
            COUNT(*) as quantidade_pedidos,
            SUM(p.total) as total_gasto,
            AVG(p.total) as ticket_medio
          FROM clientes c
          JOIN pedidos p ON c.id = p.cliente_id
          WHERE p.data_pedido BETWEEN $1 AND $2
            AND p.status_pedido != 'cancelado'
          GROUP BY c.id, c.nome, c.telefone, p.tipo_pedido
          ORDER BY c.nome, p.tipo_pedido
        `, [start_date, end_date])
      ]);

      return {
        topCustomers: topCustomersResult.rows,
        newCustomersCount: newCustomersResult.rows[0].total,
        customersByType: customersByTypeResult.rows
      };
    }, 900); // Cache por 15 minutos

    res.json({ report });
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/reports/comparative - Novo: Relatório comparativo mesa vs delivery
router.post('/comparative', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const cacheKey = `reports:comparative:${start_date}:${end_date}`;

    const report = await cache.getOrFetch(cacheKey, async () => {
      const [comparativeData, hourlyData, productPreferences] = await Promise.all([
        // Comparativo geral mesa vs delivery
        db.query(`
          SELECT 
            tipo_pedido,
            COUNT(*) as total_pedidos,
            SUM(total) as total_vendas,
            AVG(total) as ticket_medio,
            SUM(taxa_entrega) as total_taxas_entrega,
            SUM(desconto_aplicado) as total_descontos,
            COUNT(DISTINCT cliente_id) as clientes_unicos
          FROM pedidos
          WHERE data_pedido BETWEEN $1 AND $2
            AND status_pedido != 'cancelado'
          GROUP BY tipo_pedido
        `, [start_date, end_date]),

        // Vendas por hora do dia separado por tipo
        db.query(`
          SELECT 
            EXTRACT(HOUR FROM data_pedido) as hora,
            tipo_pedido,
            COUNT(*) as quantidade_pedidos,
            SUM(total) as total_vendas
          FROM pedidos
          WHERE data_pedido BETWEEN $1 AND $2
            AND status_pedido != 'cancelado'
          GROUP BY EXTRACT(HOUR FROM data_pedido), tipo_pedido
          ORDER BY hora, tipo_pedido
        `, [start_date, end_date]),

        // Preferências de produtos por tipo
        db.query(`
          SELECT 
            p.tipo_pedido,
            COALESCE(ip.sabor_registrado, pr.nome) as produto_nome,
            pr.tipo_produto,
            SUM(ip.quantidade) as quantidade_vendida,
            COUNT(DISTINCT p.id) as pedidos_diferentes
          FROM itens_pedido ip
          JOIN pedidos p ON ip.pedido_id = p.id
          LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
          WHERE p.data_pedido BETWEEN $1 AND $2
            AND p.status_pedido != 'cancelado'
          GROUP BY p.tipo_pedido, produto_nome, pr.tipo_produto
          ORDER BY p.tipo_pedido, quantidade_vendida DESC
        `, [start_date, end_date])
      ]);

      return {
        comparative: comparativeData.rows,
        hourlyBreakdown: hourlyData.rows,
        productPreferences: productPreferences.rows
      };
    }, 900); // Cache por 15 minutos

    res.json({ report });
  } catch (error) {
    console.error('Erro ao gerar relatório comparativo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 