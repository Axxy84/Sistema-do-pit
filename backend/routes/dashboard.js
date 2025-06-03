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

// GET /api/dashboard/fechamento-consolidado - Dashboard consolidado com mesa vs delivery
router.get('/fechamento-consolidado', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    // Definir período padrão (hoje)
    const hoje = new Date().toISOString().split('T')[0];
    const startDate = data_inicio || hoje;
    const endDate = data_fim || hoje;

    console.log(`📊 [Dashboard] Buscando dados consolidados de ${startDate} até ${endDate}`);

    // Buscar dados de vendas por tipo de pedido
    const vendasPorTipoResult = await db.query(`
      SELECT 
        tipo_pedido,
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(AVG(total), 0) as ticket_medio,
        COALESCE(SUM(desconto_aplicado), 0) as descontos_totais,
        COALESCE(SUM(taxa_entrega), 0) as total_taxas_entrega,
        COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
        COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
        COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix,
        MIN(DATE(data_pedido)) as data_inicio,
        MAX(DATE(data_pedido)) as data_fim
      FROM pedidos 
      WHERE DATE(data_pedido) BETWEEN $1 AND $2
        AND status_pedido = 'entregue'
        AND tipo_pedido IN ('mesa', 'delivery')
      GROUP BY tipo_pedido
      ORDER BY tipo_pedido
    `, [startDate, endDate]);

    // Buscar status das mesas abertas
    const mesasAbertasResult = await db.query(`
      SELECT 
        numero_mesa,
        status_pedido,
        COUNT(*) as pedidos_pendentes,
        SUM(total) as valor_pendente,
        MIN(created_at) as abertura_mesa,
        MAX(updated_at) as ultima_atividade
      FROM pedidos 
      WHERE tipo_pedido = 'mesa'
        AND status_pedido != 'fechado'
        AND numero_mesa IS NOT NULL
      GROUP BY numero_mesa, status_pedido
      ORDER BY numero_mesa
    `);

    // Buscar fechamentos salvos no período
    const fechamentosSalvosResult = await db.query(`
      SELECT 
        data_fechamento,
        total_vendas,
        saldo_final,
        vendas_por_metodo,
        created_at
      FROM fechamento_caixa 
      WHERE DATE(data_fechamento) BETWEEN $1 AND $2
      ORDER BY data_fechamento DESC
    `, [startDate, endDate]);

    // Buscar top produtos por período
    const topProdutosResult = await db.query(`
      SELECT 
        ip.sabor_registrado as produto_nome,
        COUNT(*) as quantidade_vendida,
        SUM(ip.quantidade * ip.valor_unitario) as receita_total,
        p.tipo_pedido
      FROM itens_pedido ip
      JOIN pedidos p ON ip.pedido_id = p.id
      WHERE DATE(p.data_pedido) BETWEEN $1 AND $2
        AND p.status_pedido = 'entregue'
        AND ip.sabor_registrado IS NOT NULL
      GROUP BY ip.sabor_registrado, p.tipo_pedido
      ORDER BY quantidade_vendida DESC
      LIMIT 20
    `, [startDate, endDate]);

    // Processar dados
    const vendasPorTipo = vendasPorTipoResult.rows.reduce((acc, row) => {
      acc[row.tipo_pedido] = {
        tipo_pedido: row.tipo_pedido,
        total_pedidos: parseInt(row.total_pedidos || 0),
        vendas_brutas: parseFloat(row.vendas_brutas || 0),
        ticket_medio: parseFloat(row.ticket_medio || 0),
        descontos_totais: parseFloat(row.descontos_totais || 0),
        total_taxas_entrega: parseFloat(row.total_taxas_entrega || 0),
        vendas_liquidas: parseFloat(row.vendas_brutas || 0) - parseFloat(row.descontos_totais || 0),
        formas_pagamento: {
          dinheiro: {
            pedidos: parseInt(row.pedidos_dinheiro || 0),
            valor: parseFloat(row.vendas_dinheiro || 0)
          },
          cartao: {
            pedidos: parseInt(row.pedidos_cartao || 0),
            valor: parseFloat(row.vendas_cartao || 0)
          },
          pix: {
            pedidos: parseInt(row.pedidos_pix || 0),
            valor: parseFloat(row.vendas_pix || 0)
          }
        }
      };
      return acc;
    }, {});

    const mesasAbertas = mesasAbertasResult.rows.map(mesa => ({
      numero_mesa: mesa.numero_mesa,
      status_pedido: mesa.status_pedido,
      pedidos_pendentes: parseInt(mesa.pedidos_pendentes || 0),
      valor_pendente: parseFloat(mesa.valor_pendente || 0),
      abertura_mesa: mesa.abertura_mesa,
      ultima_atividade: mesa.ultima_atividade
    }));

    const fechamentosSalvos = fechamentosSalvosResult.rows.map(fechamento => ({
      data_fechamento: fechamento.data_fechamento,
      total_vendas: parseFloat(fechamento.total_vendas || 0),
      saldo_final: parseFloat(fechamento.saldo_final || 0),
      vendas_por_metodo: fechamento.vendas_por_metodo,
      created_at: fechamento.created_at
    }));

    const topProdutos = topProdutosResult.rows.map(produto => ({
      produto_nome: produto.produto_nome,
      quantidade_vendida: parseInt(produto.quantidade_vendida || 0),
      receita_total: parseFloat(produto.receita_total || 0),
      tipo_pedido: produto.tipo_pedido
    }));

    // Totais gerais
    const totaisGerais = {
      total_pedidos: Object.values(vendasPorTipo).reduce((sum, tipo) => sum + tipo.total_pedidos, 0),
      vendas_brutas: Object.values(vendasPorTipo).reduce((sum, tipo) => sum + tipo.vendas_brutas, 0),
      vendas_liquidas: Object.values(vendasPorTipo).reduce((sum, tipo) => sum + tipo.vendas_liquidas, 0),
      total_taxas_entrega: Object.values(vendasPorTipo).reduce((sum, tipo) => sum + tipo.total_taxas_entrega, 0),
      mesas_abertas: mesasAbertas.length,
      valor_pendente_mesas: mesasAbertas.reduce((sum, mesa) => sum + mesa.valor_pendente, 0)
    };

    console.log(`✅ [Dashboard] Dados consolidados processados:`, {
      periodo: `${startDate} - ${endDate}`,
      tipos_encontrados: Object.keys(vendasPorTipo),
      total_pedidos: totaisGerais.total_pedidos,
      mesas_abertas: totaisGerais.mesas_abertas
    });

    res.json({
      periodo: { inicio: startDate, fim: endDate },
      vendas_por_tipo: vendasPorTipo,
      mesas_abertas: mesasAbertas,
      fechamentos_salvos: fechamentosSalvos,
      top_produtos: topProdutos,
      totais_gerais: totaisGerais
    });

  } catch (error) {
    console.error('❌ [Dashboard] Erro ao buscar dados consolidados:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/dashboard/mesas-tempo-real - Status das mesas em tempo real
router.get('/mesas-tempo-real', authenticateToken, async (req, res) => {
  try {
    const mesasResult = await db.query(`
      SELECT 
        numero_mesa,
        status_pedido,
        COUNT(*) as total_pedidos,
        SUM(total) as valor_total,
        MIN(created_at) as abertura,
        MAX(updated_at) as ultima_atividade,
        MAX(CASE WHEN cliente_id IS NOT NULL THEN 1 ELSE 0 END) as tem_cliente,
        STRING_AGG(DISTINCT c.nome, ', ') as nomes_clientes
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE tipo_pedido = 'mesa'
        AND numero_mesa IS NOT NULL
        AND (status_pedido != 'fechado' OR DATE(updated_at) = CURRENT_DATE)
      GROUP BY numero_mesa, status_pedido
      ORDER BY numero_mesa
    `);

    const mesas = mesasResult.rows.map(mesa => ({
      numero_mesa: mesa.numero_mesa,
      status_pedido: mesa.status_pedido,
      total_pedidos: parseInt(mesa.total_pedidos || 0),
      valor_total: parseFloat(mesa.valor_total || 0),
      abertura: mesa.abertura,
      ultima_atividade: mesa.ultima_atividade,
      tem_cliente: mesa.tem_cliente === 1,
      nomes_clientes: mesa.nomes_clientes,
      tempo_ativa: mesa.abertura ? new Date() - new Date(mesa.abertura) : 0
    }));

    console.log(`📋 [Dashboard] Status tempo real: ${mesas.length} mesas encontradas`);

    res.json({ mesas });

  } catch (error) {
    console.error('❌ [Dashboard] Erro ao buscar status das mesas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 