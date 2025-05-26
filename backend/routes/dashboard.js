const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/dashboard - Buscar todos os dados do dashboard
router.get('/', async (req, res) => {
  try {
    // Data de hoje
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // KPIs de hoje
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

    const kpis = {
      salesToday: parseFloat(salesResult.rows[0]?.total_sales || 0),
      newCustomersToday: parseInt(customersResult.rows[0]?.new_customers || 0),
      pizzasSoldToday: parseInt(pizzasResult.rows[0]?.pizzas_sold || 0),
      pendingOrders: parseInt(pendingResult.rows[0]?.pending_orders || 0)
    };

    // Pedidos recentes (últimos 5)
    const recentOrdersResult = await db.query(`
      SELECT p.id, p.total, p.status_pedido, c.nome as cliente_nome
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    const recentOrders = recentOrdersResult.rows.map(order => ({
      id: order.id,
      total: parseFloat(order.total),
      status_pedido: order.status_pedido,
      cliente_id: {
        nome: order.cliente_nome
      }
    }));

    // Top pizzas mais vendidas (últimos 30 dias)
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

    const topPizzas = topPizzasResult.rows.map(pizza => ({
      nome: pizza.nome,
      total_vendido: parseInt(pizza.total_vendido)
    }));

    // Vendas ao longo do tempo (últimos 30 dias)
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

    const salesOverTime = salesOverTimeResult.rows.map(sale => ({
      data: sale.data,
      total_vendas: parseFloat(sale.total_vendas)
    }));

    res.json({
      kpis,
      recentOrders,
      topPizzas,
      salesOverTime
    });

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 