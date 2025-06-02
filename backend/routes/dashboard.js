const express = require('express');
const router = express.Router();
const db = require('../config/database');
const cache = require('../cache/cache-manager');
const { CacheKeys, getDateKey } = require('../cache/cache-keys');

// GET /api/dashboard - Buscar todos os dados do dashboard
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    const todayKey = getDateKey(today);
    
    // Chave única para todo o dashboard
    const dashboardCacheKey = CacheKeys.DASHBOARD_DATA;
    
    // Implementação Cache-Aside - busca no cache primeiro
    const cachedDashboard = cache.get(dashboardCacheKey);
    if (cachedDashboard) {
      return res.json(cachedDashboard);
    }

    // Cache miss - busca dados do banco
    const dashboardData = await fetchDashboardData(today, todayKey);
    
    // Armazena no cache por 2 minutos (dados do dashboard mudam frequentemente)
    cache.set(dashboardCacheKey, dashboardData, 120);
    
    res.json(dashboardData);

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

/**
 * Função para buscar todos os dados do dashboard
 * Separada para facilitar o cache e testes
 */
async function fetchDashboardData(today, todayKey) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Busca KPIs com cache individual (mais granular)
  const kpis = await fetchKPIs(todayStart, todayEnd, todayKey);
  
  // Busca pedidos recentes com cache
  const recentOrders = await fetchRecentOrders();
  
  // Busca top pizzas com cache
  const topPizzas = await fetchTopPizzas(thirtyDaysAgo);
  
  // Busca vendas ao longo do tempo com cache
  const salesOverTime = await fetchSalesOverTime(thirtyDaysAgo);

  return {
    kpis,
    recentOrders,
    topPizzas,
    salesOverTime
  };
}

/**
 * Busca KPIs do dia com cache individual
 */
async function fetchKPIs(todayStart, todayEnd, todayKey) {
  const kpisCacheKey = CacheKeys.DASHBOARD_KPIS(todayKey);
  
  return await cache.getOrFetch(kpisCacheKey, async () => {
    const kpisPromises = [
      // Vendas do dia
      db.query(`
        SELECT COALESCE(SUM(total), 0) as total_sales
        FROM pedidos 
        WHERE status_pedido = 'entregue' 
        AND data_pedido >= $1 AND data_pedido <= $2
      `, [todayStart, todayEnd]),
      
      // Novos clientes hoje
      db.query(`
        SELECT COUNT(*) as new_customers
        FROM clientes 
        WHERE created_at >= $1 AND created_at <= $2
      `, [todayStart, todayEnd]),
      
      // Pizzas vendidas hoje
      db.query(`
        SELECT COALESCE(SUM(ip.quantidade), 0) as pizzas_sold
        FROM itens_pedido ip
        JOIN pedidos p ON ip.pedido_id = p.id
        JOIN produtos pr ON ip.produto_id_ref = pr.id
        WHERE pr.tipo_produto = 'pizza'
        AND p.data_pedido >= $1 AND p.data_pedido <= $2
        AND p.status_pedido = 'entregue'
      `, [todayStart, todayEnd]),
      
      // Pedidos pendentes
      db.query(`
        SELECT COUNT(*) as pending_orders
        FROM pedidos 
        WHERE status_pedido NOT IN ('entregue', 'cancelado')
      `)
    ];

    const [salesResult, customersResult, pizzasResult, pendingResult] = await Promise.all(kpisPromises);

    return {
      salesToday: parseFloat(salesResult.rows[0]?.total_sales || 0),
      newCustomersToday: parseInt(customersResult.rows[0]?.new_customers || 0),
      pizzasSoldToday: parseInt(pizzasResult.rows[0]?.pizzas_sold || 0),
      pendingOrders: parseInt(pendingResult.rows[0]?.pending_orders || 0)
    };
  }, 180); // Cache por 3 minutos
}

/**
 * Busca pedidos recentes com cache
 */
async function fetchRecentOrders() {
  const recentOrdersCacheKey = CacheKeys.DASHBOARD_RECENT_ORDERS;
  
  return await cache.getOrFetch(recentOrdersCacheKey, async () => {
    const recentOrdersResult = await db.query(`
      SELECT p.id, p.total, p.status_pedido, c.nome as cliente_nome
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    return recentOrdersResult.rows.map(order => ({
      id: order.id,
      total: parseFloat(order.total),
      status_pedido: order.status_pedido,
      cliente_id: {
        nome: order.cliente_nome
      }
    }));
  }, 60); // Cache por 1 minuto (dados mais dinâmicos)
}

/**
 * Busca top pizzas mais vendidas com cache
 */
async function fetchTopPizzas(thirtyDaysAgo) {
  const topPizzasCacheKey = CacheKeys.DASHBOARD_TOP_PIZZAS(30);
  
  return await cache.getOrFetch(topPizzasCacheKey, async () => {
    const topPizzasResult = await db.query(`
      SELECT 
        COALESCE(ip.sabor_registrado, pr.nome) as nome,
        SUM(ip.quantidade) as total_vendido
      FROM itens_pedido ip
      JOIN pedidos p ON ip.pedido_id = p.id
      LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
      WHERE (pr.tipo_produto = 'pizza' OR ip.sabor_registrado IS NOT NULL)
      AND p.data_pedido >= $1
      AND p.status_pedido = 'entregue'
      GROUP BY COALESCE(ip.sabor_registrado, pr.nome)
      ORDER BY total_vendido DESC
      LIMIT 7
    `, [thirtyDaysAgo]);

    return topPizzasResult.rows.map(pizza => ({
      nome: pizza.nome,
      total_vendido: parseInt(pizza.total_vendido)
    }));
  }, 600); // Cache por 10 minutos (dados menos voláteis)
}

/**
 * Busca vendas ao longo do tempo com cache
 */
async function fetchSalesOverTime(thirtyDaysAgo) {
  const salesOvertimeCacheKey = CacheKeys.DASHBOARD_SALES_OVERTIME(30);
  
  return await cache.getOrFetch(salesOvertimeCacheKey, async () => {
    const salesOverTimeResult = await db.query(`
      SELECT 
        DATE(data_pedido) as data,
        COALESCE(SUM(total), 0) as total_vendas
      FROM pedidos
      WHERE status_pedido = 'entregue'
      AND data_pedido >= $1
      GROUP BY DATE(data_pedido)
      ORDER BY DATE(data_pedido)
    `, [thirtyDaysAgo]);

    return salesOverTimeResult.rows.map(sale => ({
      data: sale.data,
      total_vendas: parseFloat(sale.total_vendas)
    }));
  }, 600); // Cache por 10 minutos
}

module.exports = router; 