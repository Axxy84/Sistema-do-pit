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

// Middleware de autenticação específico para dono/admin
const authenticateOwner = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pizzaria-secret-key');
    
    // Verificar se é admin/dono
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1 AND tipo_usuario = $2',
      [decoded.userId, 'admin']
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado - apenas proprietários' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Rate limiting
const rateLimit = require('express-rate-limit');
const ownerLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Mais requests para analytics
  message: 'Muitas requisições, tente novamente em 15 minutos'
});

router.use(ownerLimit);

/**
 * @swagger
 * /api/owner/dashboard:
 *   get:
 *     summary: Dashboard executivo completo
 *     tags: [Owner App]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: today
 *     responses:
 *       200:
 *         description: Métricas executivas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     growth:
 *                       type: number
 *                     target_achievement:
 *                       type: number
 *                 orders:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     average_ticket:
 *                       type: number
 *                     conversion_rate:
 *                       type: number
 *                 performance:
 *                   type: object
 *                   properties:
 *                     delivery_time_avg:
 *                       type: number
 *                     table_turnover:
 *                       type: number
 *                     customer_satisfaction:
 *                       type: number
 */
router.get('/dashboard', authenticateOwner, async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    // Definir filtros de data
    let dateFilter = '';
    let previousPeriodFilter = '';
    
    switch (period) {
      case 'week':
        dateFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '7 days'";
        previousPeriodFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '14 days' AND p.data_pedido < CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '30 days'";
        previousPeriodFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '60 days' AND p.data_pedido < CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'quarter':
        dateFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '90 days'";
        previousPeriodFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '180 days' AND p.data_pedido < CURRENT_DATE - INTERVAL '90 days'";
        break;
      case 'year':
        dateFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '365 days'";
        previousPeriodFilter = "AND p.data_pedido >= CURRENT_DATE - INTERVAL '730 days' AND p.data_pedido < CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND DATE(p.data_pedido) = CURRENT_DATE";
        previousPeriodFilter = "AND DATE(p.data_pedido) = CURRENT_DATE - INTERVAL '1 day'";
    }

    // Métricas de receita atuais
    const revenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(p.valor_total), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(p.valor_total), 0) as average_ticket,
        COUNT(CASE WHEN p.status_pedido NOT IN ('cancelado') THEN 1 END) as successful_orders
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado') ${dateFilter}
    `);

    // Métricas do período anterior para comparação
    const previousRevenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(p.valor_total), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado') ${previousPeriodFilter}
    `);

    // Métricas de performance
    const performanceResult = await pool.query(`
      SELECT 
        COALESCE(AVG(
          CASE WHEN p.tipo_pedido = 'delivery' AND p.data_entrega IS NOT NULL AND p.data_saida_entrega IS NOT NULL
          THEN EXTRACT(EPOCH FROM (p.data_entrega - p.data_saida_entrega))/60 
          END
        ), 0) as avg_delivery_time,
        
        COALESCE(AVG(
          CASE WHEN p.tipo_pedido = 'mesa' AND p.data_fechamento IS NOT NULL
          THEN EXTRACT(EPOCH FROM (p.data_fechamento - p.data_pedido))/60 
          END
        ), 0) as avg_table_time,
        
        COUNT(CASE WHEN p.tipo_pedido = 'delivery' THEN 1 END) as delivery_orders,
        COUNT(CASE WHEN p.tipo_pedido = 'mesa' THEN 1 END) as table_orders
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado') ${dateFilter}
    `);

    // Top produtos
    const topProductsResult = await pool.query(`
      SELECT 
        pr.nome,
        pr.tipo_produto,
        SUM(ip.quantidade) as quantidade_vendida,
        SUM(ip.quantidade * ip.preco_unitario) as receita_produto,
        COUNT(DISTINCT ip.pedido_id) as pedidos_com_produto
      FROM itens_pedido ip
      JOIN produtos pr ON ip.produto_id = pr.id
      JOIN pedidos p ON ip.pedido_id = p.id
      WHERE p.status_pedido NOT IN ('cancelado') ${dateFilter}
      GROUP BY pr.id, pr.nome, pr.tipo_produto
      ORDER BY receita_produto DESC
      LIMIT 10
    `);

    // Análise por tipo de pedido
    const orderTypeResult = await pool.query(`
      SELECT 
        p.tipo_pedido,
        COUNT(*) as quantidade,
        SUM(p.valor_total) as receita,
        AVG(p.valor_total) as ticket_medio
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado') ${dateFilter}
      GROUP BY p.tipo_pedido
    `);

    // Análise de formas de pagamento
    const paymentMethodResult = await pool.query(`
      SELECT 
        p.forma_pagamento,
        COUNT(*) as quantidade,
        SUM(p.valor_total) as valor_total
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado') 
        AND p.forma_pagamento IS NOT NULL ${dateFilter}
      GROUP BY p.forma_pagamento
      ORDER BY valor_total DESC
    `);

    // Análise temporal (últimos 30 dias)
    const timeSeriesResult = await pool.query(`
      SELECT 
        DATE(p.data_pedido) as data,
        COUNT(*) as pedidos,
        SUM(p.valor_total) as receita,
        COUNT(CASE WHEN p.tipo_pedido = 'delivery' THEN 1 END) as delivery,
        COUNT(CASE WHEN p.tipo_pedido = 'mesa' THEN 1 END) as mesa
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado')
        AND p.data_pedido >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(p.data_pedido)
      ORDER BY data DESC
      LIMIT 30
    `);

    // Performance de entregadores
    const delivererPerformanceResult = await pool.query(`
      SELECT 
        e.nome,
        COUNT(p.id) as entregas_realizadas,
        AVG(EXTRACT(EPOCH FROM (p.data_entrega - p.data_saida_entrega))/60) as tempo_medio_entrega,
        SUM(p.taxa_entrega * 0.7) as total_comissao
      FROM entregadores e
      LEFT JOIN pedidos p ON e.id = p.entregador_id 
        AND p.status_pedido = 'entregue' ${dateFilter}
      WHERE e.ativo = true
      GROUP BY e.id, e.nome
      ORDER BY entregas_realizadas DESC
      LIMIT 10
    `);

    // Calcular crescimento
    const currentRevenue = parseFloat(revenueResult.rows[0].total_revenue);
    const previousRevenue = parseFloat(previousRevenueResult.rows[0].total_revenue);
    const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

    // Calcular taxa de conversão (orders vs visits - proxy)
    const conversionRate = 85; // Implementar tracking de visitas no futuro

    // Montar resposta
    const dashboard = {
      period,
      summary: {
        revenue: {
          total: currentRevenue,
          growth: Math.round(growth * 100) / 100,
          target_achievement: Math.round((currentRevenue / (currentRevenue * 1.1)) * 100), // Meta 10% maior
          previous_period: previousRevenue
        },
        orders: {
          total: parseInt(revenueResult.rows[0].total_orders),
          successful: parseInt(revenueResult.rows[0].successful_orders),
          average_ticket: Math.round(parseFloat(revenueResult.rows[0].average_ticket) * 100) / 100,
          conversion_rate: conversionRate
        },
        performance: {
          avg_delivery_time: Math.round(parseFloat(performanceResult.rows[0].avg_delivery_time)),
          avg_table_time: Math.round(parseFloat(performanceResult.rows[0].avg_table_time)),
          delivery_orders: parseInt(performanceResult.rows[0].delivery_orders),
          table_orders: parseInt(performanceResult.rows[0].table_orders)
        }
      },
      analytics: {
        top_products: topProductsResult.rows.map(product => ({
          nome: product.nome,
          tipo: product.tipo_produto,
          quantidade_vendida: parseInt(product.quantidade_vendida),
          receita: parseFloat(product.receita_produto),
          pedidos: parseInt(product.pedidos_com_produto)
        })),
        order_types: orderTypeResult.rows.map(type => ({
          tipo: type.tipo_pedido,
          quantidade: parseInt(type.quantidade),
          receita: parseFloat(type.receita),
          ticket_medio: Math.round(parseFloat(type.ticket_medio) * 100) / 100
        })),
        payment_methods: paymentMethodResult.rows.map(method => ({
          metodo: method.forma_pagamento,
          quantidade: parseInt(method.quantidade),
          valor_total: parseFloat(method.valor_total)
        })),
        time_series: timeSeriesResult.rows.map(day => ({
          data: day.data,
          pedidos: parseInt(day.pedidos),
          receita: parseFloat(day.receita),
          delivery: parseInt(day.delivery),
          mesa: parseInt(day.mesa)
        })),
        deliverer_performance: delivererPerformanceResult.rows.map(deliverer => ({
          nome: deliverer.nome,
          entregas: parseInt(deliverer.entregas_realizadas || 0),
          tempo_medio: Math.round(parseFloat(deliverer.tempo_medio_entrega || 0)),
          comissao: parseFloat(deliverer.total_comissao || 0)
        }))
      }
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/owner/reports/financial:
 *   get:
 *     summary: Relatório financeiro detalhado
 *     tags: [Owner App]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/reports/financial', authenticateOwner, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND DATE(p.data_pedido) BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    } else {
      dateFilter = 'AND DATE(p.data_pedido) = CURRENT_DATE';
    }

    // Receitas
    const revenueResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN p.forma_pagamento = 'dinheiro' THEN p.valor_total ELSE 0 END) as dinheiro,
        SUM(CASE WHEN p.forma_pagamento = 'cartao' THEN p.valor_total ELSE 0 END) as cartao,
        SUM(CASE WHEN p.forma_pagamento = 'pix' THEN p.valor_total ELSE 0 END) as pix,
        SUM(p.valor_total) as total_receita,
        SUM(p.taxa_entrega) as total_taxas_entrega
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado') ${dateFilter}
    `, params);

    // Despesas
    const expensesResult = await pool.query(`
      SELECT 
        categoria,
        SUM(valor) as total_categoria
      FROM despesas d
      WHERE 1=1 ${dateFilter.replace('p.data_pedido', 'd.data_despesa')}
      GROUP BY categoria
      ORDER BY total_categoria DESC
    `, params);

    // Comissões de entregadores
    const commissionsResult = await pool.query(`
      SELECT 
        SUM(p.taxa_entrega * 0.7) as total_comissoes
      FROM pedidos p
      WHERE p.status_pedido = 'entregue' 
        AND p.tipo_pedido = 'delivery' ${dateFilter}
    `, params);

    // Lucro bruto por produto
    const productProfitResult = await pool.query(`
      SELECT 
        pr.nome,
        pr.tipo_produto,
        SUM(ip.quantidade) as quantidade_vendida,
        SUM(ip.quantidade * ip.preco_unitario) as receita_bruta,
        SUM(ip.quantidade * pr.custo_producao) as custo_total,
        SUM(ip.quantidade * (ip.preco_unitario - pr.custo_producao)) as lucro_bruto
      FROM itens_pedido ip
      JOIN produtos pr ON ip.produto_id = pr.id
      JOIN pedidos p ON ip.pedido_id = p.id
      WHERE p.status_pedido NOT IN ('cancelado') ${dateFilter}
      GROUP BY pr.id, pr.nome, pr.tipo_produto
      ORDER BY lucro_bruto DESC
      LIMIT 20
    `, params);

    const financial = {
      period: { start_date, end_date },
      revenue: {
        by_payment_method: {
          dinheiro: parseFloat(revenueResult.rows[0].dinheiro || 0),
          cartao: parseFloat(revenueResult.rows[0].cartao || 0),
          pix: parseFloat(revenueResult.rows[0].pix || 0)
        },
        total: parseFloat(revenueResult.rows[0].total_receita || 0),
        delivery_fees: parseFloat(revenueResult.rows[0].total_taxas_entrega || 0)
      },
      expenses: {
        by_category: expensesResult.rows.map(expense => ({
          categoria: expense.categoria,
          valor: parseFloat(expense.total_categoria)
        })),
        total: expensesResult.rows.reduce((sum, expense) => sum + parseFloat(expense.total_categoria), 0)
      },
      commissions: {
        deliverers: parseFloat(commissionsResult.rows[0].total_comissoes || 0)
      },
      product_analysis: productProfitResult.rows.map(product => ({
        nome: product.nome,
        tipo: product.tipo_produto,
        quantidade: parseInt(product.quantidade_vendida),
        receita_bruta: parseFloat(product.receita_bruta),
        custo_total: parseFloat(product.custo_total || 0),
        lucro_bruto: parseFloat(product.lucro_bruto || 0),
        margem: product.receita_bruta > 0 ? 
          Math.round((parseFloat(product.lucro_bruto || 0) / parseFloat(product.receita_bruta)) * 100) : 0
      }))
    };

    // Calcular totais
    financial.summary = {
      receita_total: financial.revenue.total,
      despesas_total: financial.expenses.total,
      comissoes_total: financial.commissions.deliverers,
      lucro_liquido: financial.revenue.total - financial.expenses.total - financial.commissions.deliverers
    };

    res.json(financial);
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/owner/analytics/customers:
 *   get:
 *     summary: Análise de clientes
 *     tags: [Owner App]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/customers', authenticateOwner, async (req, res) => {
  try {
    // Clientes mais frequentes
    const topCustomersResult = await pool.query(`
      SELECT 
        c.nome,
        c.telefone,
        COUNT(p.id) as total_pedidos,
        SUM(p.valor_total) as valor_total_gasto,
        AVG(p.valor_total) as ticket_medio,
        MAX(p.data_pedido) as ultimo_pedido,
        MIN(p.data_pedido) as primeiro_pedido
      FROM clientes c
      JOIN pedidos p ON c.id = p.cliente_id
      WHERE p.status_pedido NOT IN ('cancelado')
      GROUP BY c.id, c.nome, c.telefone
      HAVING COUNT(p.id) >= 2
      ORDER BY valor_total_gasto DESC
      LIMIT 50
    `);

    // Análise de frequência
    const frequencyResult = await pool.query(`
      WITH customer_frequency AS (
        SELECT 
          c.id,
          COUNT(p.id) as pedidos_count
        FROM clientes c
        JOIN pedidos p ON c.id = p.cliente_id
        WHERE p.status_pedido NOT IN ('cancelado')
        GROUP BY c.id
      )
      SELECT 
        CASE 
          WHEN pedidos_count = 1 THEN 'Único pedido'
          WHEN pedidos_count BETWEEN 2 AND 5 THEN 'Casual (2-5)'
          WHEN pedidos_count BETWEEN 6 AND 15 THEN 'Regular (6-15)'
          WHEN pedidos_count > 15 THEN 'VIP (15+)'
        END as categoria,
        COUNT(*) as quantidade_clientes,
        AVG(pedidos_count) as media_pedidos
      FROM customer_frequency
      GROUP BY 
        CASE 
          WHEN pedidos_count = 1 THEN 'Único pedido'
          WHEN pedidos_count BETWEEN 2 AND 5 THEN 'Casual (2-5)'
          WHEN pedidos_count BETWEEN 6 AND 15 THEN 'Regular (6-15)'
          WHEN pedidos_count > 15 THEN 'VIP (15+)'
        END
      ORDER BY MIN(pedidos_count)
    `);

    // Análise de retenção
    const retentionResult = await pool.query(`
      WITH monthly_customers AS (
        SELECT 
          DATE_TRUNC('month', p.data_pedido) as mes,
          c.id as cliente_id
        FROM clientes c
        JOIN pedidos p ON c.id = p.cliente_id
        WHERE p.status_pedido NOT IN ('cancelado')
          AND p.data_pedido >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', p.data_pedido), c.id
      )
      SELECT 
        mes,
        COUNT(DISTINCT cliente_id) as clientes_ativos
      FROM monthly_customers
      GROUP BY mes
      ORDER BY mes DESC
    `);

    // Novos clientes por mês
    const newCustomersResult = await pool.query(`
      WITH first_orders AS (
        SELECT 
          c.id,
          MIN(p.data_pedido) as primeiro_pedido
        FROM clientes c
        JOIN pedidos p ON c.id = p.cliente_id
        WHERE p.status_pedido NOT IN ('cancelado')
        GROUP BY c.id
      )
      SELECT 
        DATE_TRUNC('month', primeiro_pedido) as mes,
        COUNT(*) as novos_clientes
      FROM first_orders
      WHERE primeiro_pedido >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', primeiro_pedido)
      ORDER BY mes DESC
    `);

    const analytics = {
      top_customers: topCustomersResult.rows.map(customer => ({
        nome: customer.nome,
        telefone: customer.telefone,
        total_pedidos: parseInt(customer.total_pedidos),
        valor_total: parseFloat(customer.valor_total_gasto),
        ticket_medio: Math.round(parseFloat(customer.ticket_medio) * 100) / 100,
        ultimo_pedido: customer.ultimo_pedido,
        cliente_desde: customer.primeiro_pedido,
        dias_como_cliente: Math.floor((Date.now() - new Date(customer.primeiro_pedido)) / (1000 * 60 * 60 * 24))
      })),
      frequency_analysis: frequencyResult.rows.map(freq => ({
        categoria: freq.categoria,
        quantidade_clientes: parseInt(freq.quantidade_clientes),
        media_pedidos: Math.round(parseFloat(freq.media_pedidos) * 100) / 100
      })),
      retention_analysis: retentionResult.rows.map(retention => ({
        mes: retention.mes,
        clientes_ativos: parseInt(retention.clientes_ativos)
      })),
      new_customers: newCustomersResult.rows.map(newCust => ({
        mes: newCust.mes,
        novos_clientes: parseInt(newCust.novos_clientes)
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Erro ao analisar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/owner/analytics/operations:
 *   get:
 *     summary: Análise operacional
 *     tags: [Owner App]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/operations', authenticateOwner, async (req, res) => {
  try {
    // Análise de horários de pico
    const peakHoursResult = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM p.data_pedido) as hora,
        COUNT(*) as quantidade_pedidos,
        AVG(p.valor_total) as ticket_medio,
        COUNT(CASE WHEN p.tipo_pedido = 'delivery' THEN 1 END) as delivery,
        COUNT(CASE WHEN p.tipo_pedido = 'mesa' THEN 1 END) as mesa
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado')
        AND p.data_pedido >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM p.data_pedido)
      ORDER BY hora
    `);

    // Análise de dias da semana
    const weekdayResult = await pool.query(`
      SELECT 
        CASE EXTRACT(DOW FROM p.data_pedido)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Segunda'
          WHEN 2 THEN 'Terça'
          WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta'
          WHEN 5 THEN 'Sexta'
          WHEN 6 THEN 'Sábado'
        END as dia_semana,
        EXTRACT(DOW FROM p.data_pedido) as dow,
        COUNT(*) as quantidade_pedidos,
        SUM(p.valor_total) as receita_total,
        AVG(p.valor_total) as ticket_medio
      FROM pedidos p
      WHERE p.status_pedido NOT IN ('cancelado')
        AND p.data_pedido >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(DOW FROM p.data_pedido)
      ORDER BY dow
    `);

    // Performance de entregadores
    const deliveryPerformanceResult = await pool.query(`
      SELECT 
        e.nome,
        COUNT(p.id) as total_entregas,
        AVG(EXTRACT(EPOCH FROM (p.data_entrega - p.data_saida_entrega))/60) as tempo_medio,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (p.data_entrega - p.data_saida_entrega))/60 <= 30 THEN 1 END) as entregas_no_prazo,
        SUM(p.taxa_entrega * 0.7) as total_comissao
      FROM entregadores e
      LEFT JOIN pedidos p ON e.id = p.entregador_id 
        AND p.status_pedido = 'entregue'
        AND p.data_pedido >= CURRENT_DATE - INTERVAL '30 days'
      WHERE e.ativo = true
      GROUP BY e.id, e.nome
      HAVING COUNT(p.id) > 0
      ORDER BY total_entregas DESC
    `);

    // Análise de cancelamentos
    const cancellationResult = await pool.query(`
      SELECT 
        COUNT(*) as total_cancelamentos,
        AVG(EXTRACT(EPOCH FROM (p.updated_at - p.data_pedido))/60) as tempo_medio_ate_cancelamento,
        COUNT(CASE WHEN p.tipo_pedido = 'delivery' THEN 1 END) as cancelamentos_delivery,
        COUNT(CASE WHEN p.tipo_pedido = 'mesa' THEN 1 END) as cancelamentos_mesa
      FROM pedidos p
      WHERE p.status_pedido = 'cancelado'
        AND p.data_pedido >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Taxa de ocupação das mesas
    const tableOccupancyResult = await pool.query(`
      WITH table_usage AS (
        SELECT 
          numero_mesa,
          COUNT(*) as pedidos_mesa,
          AVG(EXTRACT(EPOCH FROM (COALESCE(data_fechamento, NOW()) - data_pedido))/60) as tempo_medio_ocupacao
        FROM pedidos p
        WHERE tipo_pedido = 'mesa'
          AND status_pedido NOT IN ('cancelado')
          AND data_pedido >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY numero_mesa
      )
      SELECT 
        COUNT(*) as mesas_utilizadas,
        AVG(pedidos_mesa) as media_pedidos_por_mesa,
        AVG(tempo_medio_ocupacao) as tempo_medio_ocupacao_geral
      FROM table_usage
    `);

    const operations = {
      peak_hours: peakHoursResult.rows.map(hour => ({
        hora: parseInt(hour.hora),
        quantidade_pedidos: parseInt(hour.quantidade_pedidos),
        ticket_medio: Math.round(parseFloat(hour.ticket_medio) * 100) / 100,
        delivery: parseInt(hour.delivery),
        mesa: parseInt(hour.mesa)
      })),
      weekday_analysis: weekdayResult.rows.map(day => ({
        dia_semana: day.dia_semana,
        quantidade_pedidos: parseInt(day.quantidade_pedidos),
        receita_total: parseFloat(day.receita_total),
        ticket_medio: Math.round(parseFloat(day.ticket_medio) * 100) / 100
      })),
      delivery_performance: deliveryPerformanceResult.rows.map(deliverer => ({
        nome: deliverer.nome,
        total_entregas: parseInt(deliverer.total_entregas),
        tempo_medio: Math.round(parseFloat(deliverer.tempo_medio || 0)),
        entregas_no_prazo: parseInt(deliverer.entregas_no_prazo || 0),
        taxa_pontualidade: deliverer.total_entregas > 0 ? 
          Math.round((parseInt(deliverer.entregas_no_prazo || 0) / parseInt(deliverer.total_entregas)) * 100) : 0,
        total_comissao: parseFloat(deliverer.total_comissao || 0)
      })),
      cancellation_analysis: {
        total: parseInt(cancellationResult.rows[0].total_cancelamentos || 0),
        tempo_medio_ate_cancelamento: Math.round(parseFloat(cancellationResult.rows[0].tempo_medio_ate_cancelamento || 0)),
        delivery: parseInt(cancellationResult.rows[0].cancelamentos_delivery || 0),
        mesa: parseInt(cancellationResult.rows[0].cancelamentos_mesa || 0)
      },
      table_occupancy: {
        mesas_utilizadas: parseInt(tableOccupancyResult.rows[0].mesas_utilizadas || 0),
        media_pedidos_por_mesa: Math.round(parseFloat(tableOccupancyResult.rows[0].media_pedidos_por_mesa || 0) * 100) / 100,
        tempo_medio_ocupacao: Math.round(parseFloat(tableOccupancyResult.rows[0].tempo_medio_ocupacao_geral || 0))
      }
    };

    res.json(operations);
  } catch (error) {
    console.error('Erro ao analisar operações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/owner/alerts:
 *   get:
 *     summary: Alertas e notificações para o proprietário
 *     tags: [Owner App]
 *     security:
 *       - bearerAuth: []
 */
router.get('/alerts', authenticateOwner, async (req, res) => {
  try {
    const alerts = [];

    // Pedidos há muito tempo sem status
    const stuckOrdersResult = await pool.query(`
      SELECT id, numero_mesa, tipo_pedido, status_pedido, data_pedido
      FROM pedidos 
      WHERE status_pedido IN ('pendente', 'preparando')
        AND data_pedido < NOW() - INTERVAL '45 minutes'
      ORDER BY data_pedido ASC
      LIMIT 10
    `);

    if (stuckOrdersResult.rows.length > 0) {
      alerts.push({
        type: 'warning',
        priority: 'high',
        category: 'operations',
        title: 'Pedidos em atraso',
        message: `${stuckOrdersResult.rows.length} pedidos há mais de 45 minutos sem progressão`,
        data: stuckOrdersResult.rows,
        timestamp: new Date()
      });
    }

    // Produtos com estoque baixo
    const lowStockResult = await pool.query(`
      SELECT nome, estoque, estoque_minimo
      FROM produtos 
      WHERE estoque IS NOT NULL 
        AND estoque_minimo IS NOT NULL
        AND estoque <= estoque_minimo
        AND ativo = true
    `);

    if (lowStockResult.rows.length > 0) {
      alerts.push({
        type: 'warning',
        priority: 'medium',
        category: 'inventory',
        title: 'Estoque baixo',
        message: `${lowStockResult.rows.length} produtos com estoque baixo`,
        data: lowStockResult.rows,
        timestamp: new Date()
      });
    }

    // Entregadores inativos há muito tempo
    const inactiveDeliverersResult = await pool.query(`
      SELECT nome, ultimo_update
      FROM entregadores 
      WHERE ativo = true 
        AND status != 'offline'
        AND ultimo_update < NOW() - INTERVAL '2 hours'
    `);

    if (inactiveDeliverersResult.rows.length > 0) {
      alerts.push({
        type: 'info',
        priority: 'low',
        category: 'staff',
        title: 'Entregadores sem atualização',
        message: `${inactiveDeliverersResult.rows.length} entregadores sem atualização há mais de 2 horas`,
        data: inactiveDeliverersResult.rows,
        timestamp: new Date()
      });
    }

    // Meta de vendas do dia
    const dailyTargetResult = await pool.query(`
      SELECT COALESCE(SUM(valor_total), 0) as vendas_hoje
      FROM pedidos 
      WHERE DATE(data_pedido) = CURRENT_DATE
        AND status_pedido NOT IN ('cancelado')
    `);

    const vendasHoje = parseFloat(dailyTargetResult.rows[0].vendas_hoje);
    const metaDiaria = 1500; // R$ 1500 por dia (configurável)
    
    if (vendasHoje < metaDiaria * 0.7 && new Date().getHours() > 18) {
      alerts.push({
        type: 'warning',
        priority: 'medium',
        category: 'sales',
        title: 'Meta de vendas em risco',
        message: `Vendas hoje: R$ ${vendasHoje.toFixed(2)} (${Math.round((vendasHoje/metaDiaria)*100)}% da meta)`,
        data: { vendas_hoje: vendasHoje, meta: metaDiaria, percentual: (vendasHoje/metaDiaria)*100 },
        timestamp: new Date()
      });
    }

    res.json({ alerts, total: alerts.length });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;