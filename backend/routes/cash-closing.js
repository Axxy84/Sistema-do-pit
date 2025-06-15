const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const cache = require('../cache/cache-manager');
const { CacheKeys, getPeriodKey, getDateKey } = require('../cache/cache-keys');

const router = express.Router();

// ==================== ROTAS DE FECHAMENTO INTEGRADO ====================

// GET /api/cash-closing - Listar todos os fechamentos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const cacheKey = CacheKeys.CASH_CLOSING_LIST(data_inicio, data_fim);
    
    // Implementação Cache-Aside
    const cash_closings = await cache.getOrFetch(cacheKey, async () => {
      let query = 'SELECT * FROM fechamento_caixa WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (data_inicio) {
        query += ` AND data_fechamento >= $${paramIndex++}`;
        params.push(data_inicio);
      }

      if (data_fim) {
        query += ` AND data_fechamento <= $${paramIndex++}`;
        params.push(data_fim);
      }

      query += ' ORDER BY data_fechamento DESC, created_at DESC';

      const result = await db.query(query, params);
      return result.rows;
    }, 600); // Cache por 10 minutos (dados históricos mudam pouco)

    res.json({ cash_closings });
  } catch (error) {
    console.error('Erro ao buscar fechamentos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/cash-closing/current - Dados para fechamento do dia atual com análise detalhada
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Buscando dados atuais para: ${today}`);
    
    // Verificar se já foi fechado hoje
    const existingClosingResult = await db.query(`
      SELECT * FROM fechamento_caixa 
      WHERE DATE(data_fechamento) = $1
    `, [today]);

    if (existingClosingResult.rows.length > 0) {
      console.log(`✅ Fechamento já existe para ${today}`);
      return res.json({ 
        cash_closing: existingClosingResult.rows[0],
        already_closed: true 
      });
    }

    console.log(`📊 Calculando dados do dia ${today}...`);

    // Buscar pedidos do dia - resumo geral
    // Usar COALESCE e timezone para garantir que pegamos pedidos corretamente
    const pedidosResult = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(SUM(desconto_aplicado), 0) as descontos_totais,
        COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
        COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
        COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at) AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
    `);

    console.log(`📦 Pedidos encontrados: ${pedidosResult.rows[0]?.total_pedidos || 0}`);

    // Buscar despesas do dia
    const despesasResult = await db.query(`
      SELECT COALESCE(SUM(valor), 0) as total_despesas
      FROM despesas_receitas 
      WHERE DATE(COALESCE(data_transacao, created_at) AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND tipo = 'despesa'
    `);

    // Buscar receitas extras do dia
    const receitasResult = await db.query(`
      SELECT COALESCE(SUM(valor), 0) as receitas_extras
      FROM despesas_receitas 
      WHERE DATE(COALESCE(data_transacao, created_at) AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND tipo = 'receita'
    `);

    // Análise detalhada por tipo de pedido (mesa vs delivery)
    const detailsByTypeResult = await db.query(`
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
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at) AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND status_pedido IN ('entregue', 'retirado', 'fechada')
      GROUP BY tipo_pedido
    `);

    console.log(`📊 Tipos de pedidos encontrados: ${detailsByTypeResult.rows.length}`);

    const pedidos = pedidosResult.rows[0] || {};
    const despesas = despesasResult.rows[0] || {};
    const receitas = receitasResult.rows[0] || {};
    const detailsByType = detailsByTypeResult.rows || [];

    // Calcular valores
    const vendas_brutas = parseFloat(pedidos.vendas_brutas || 0);
    const descontos_totais = parseFloat(pedidos.descontos_totais || 0);
    const vendas_liquidas = vendas_brutas - descontos_totais;
    const total_despesas = parseFloat(despesas.total_despesas || 0);
    const receitas_extras = parseFloat(receitas.receitas_extras || 0);
    const saldo_final = vendas_liquidas + receitas_extras - total_despesas;

    const currentData = {
      data_fechamento: today,
      total_pedidos: parseInt(pedidos.total_pedidos || 0),
      vendas_brutas: vendas_brutas,
      descontos_totais: descontos_totais,
      vendas_liquidas: vendas_liquidas,
      vendas_dinheiro: parseFloat(pedidos.vendas_dinheiro || 0),
      vendas_cartao: parseFloat(pedidos.vendas_cartao || 0),
      vendas_pix: parseFloat(pedidos.vendas_pix || 0),
      pedidos_dinheiro: parseInt(pedidos.pedidos_dinheiro || 0),
      pedidos_cartao: parseInt(pedidos.pedidos_cartao || 0),
      pedidos_pix: parseInt(pedidos.pedidos_pix || 0),
      total_despesas: total_despesas,
      receitas_extras: receitas_extras,
      saldo_final: saldo_final,
      
      // Dados detalhados por tipo
      details_by_type: detailsByType.map(detail => ({
        tipo_pedido: detail.tipo_pedido,
        total_pedidos: parseInt(detail.total_pedidos || 0),
        vendas_brutas: parseFloat(detail.vendas_brutas || 0),
        ticket_medio: parseFloat(detail.ticket_medio || 0),
        descontos_totais: parseFloat(detail.descontos_totais || 0),
        total_taxas_entrega: parseFloat(detail.total_taxas_entrega || 0),
        vendas_dinheiro: parseFloat(detail.vendas_dinheiro || 0),
        vendas_cartao: parseFloat(detail.vendas_cartao || 0),
        vendas_pix: parseFloat(detail.vendas_pix || 0),
        pedidos_dinheiro: parseInt(detail.pedidos_dinheiro || 0),
        pedidos_cartao: parseInt(detail.pedidos_cartao || 0),
        pedidos_pix: parseInt(detail.pedidos_pix || 0)
      }))
    };

    console.log(`✅ Dados calculados - Total pedidos: ${currentData.total_pedidos}, Vendas: ${currentData.vendas_brutas}`);

    res.json({ 
      cash_closing: currentData,
      already_closed: false 
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados atuais:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/cash-closing/:id - Buscar fechamento por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CacheKeys.CASH_CLOSING_BY_ID(id);
    
    // Fechamentos específicos por ID mudam raramente
    const cash_closing = await cache.getOrFetch(cacheKey, async () => {
      const result = await db.query('SELECT * FROM fechamento_caixa WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Fechamento não encontrado');
      }
      
      return result.rows[0];
    }, 1800); // Cache por 30 minutos (dados históricos são estáveis)
    
    res.json({ cash_closing });
  } catch (error) {
    if (error.message === 'Fechamento não encontrado') {
      return res.status(404).json({ error: 'Fechamento não encontrado' });
    }
    
    console.error('Erro ao buscar fechamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/cash-closing - Criar novo fechamento (integrado na página principal)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      data_fechamento,
      total_pedidos,
      total_vendas,
      total_despesas_extras,
      total_receitas_extras,
      total_descontos,
      total_impostos = 0,
      total_taxas_entrega,
      saldo_final,
      observacoes,
      vendas_por_metodo = {},
      // Novos campos para análise por tipo
      details_by_type = [],
      auto_generate = false // Flag para gerar dados automaticamente dos dados atuais
    } = req.body;

    // Se auto_generate for true, buscar dados do dia automaticamente
    if (auto_generate) {
      const today = data_fechamento || new Date().toISOString().split('T')[0];
      console.log(`🤖 Fechamento automático para: ${today}`);
      
      // Verificar se já foi fechado hoje
      const existingClosingResult = await db.query(`
        SELECT * FROM fechamento_caixa 
        WHERE DATE(data_fechamento) = $1
      `, [today]);

      if (existingClosingResult.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe um fechamento para esta data' 
        });
      }

      // Buscar dados do dia automaticamente (sem cache para garantir dados frescos)
      const pedidosResult = await db.query(`
        SELECT 
          COUNT(*) as total_pedidos,
          COALESCE(SUM(total), 0) as vendas_brutas,
          COALESCE(SUM(desconto_aplicado), 0) as descontos_totais,
          COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
          COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
          COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
          COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
          COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
          COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
        FROM pedidos 
        WHERE DATE(data_pedido) = $1 
          AND status_pedido IN ('entregue', 'fechada')
      `, [today]);

      const despesasResult = await db.query(`
        SELECT COALESCE(SUM(valor), 0) as total_despesas
        FROM despesas_receitas 
        WHERE DATE(data_transacao) = $1 
          AND tipo = 'despesa'
      `, [today]);

      const receitasResult = await db.query(`
        SELECT COALESCE(SUM(valor), 0) as receitas_extras
        FROM despesas_receitas 
        WHERE DATE(data_transacao) = $1 
          AND tipo = 'receita'
      `, [today]);

      const detailsByTypeResult = await db.query(`
        SELECT 
          tipo_pedido,
          COUNT(*) as total_pedidos,
          COALESCE(SUM(total), 0) as vendas_brutas,
          COALESCE(SUM(taxa_entrega), 0) as total_taxas_entrega
        FROM pedidos 
        WHERE DATE(data_pedido) = $1 
          AND status_pedido IN ('entregue', 'fechada')
        GROUP BY tipo_pedido
      `, [today]);

      const pedidos = pedidosResult.rows[0] || {};
      const despesas = despesasResult.rows[0] || {};
      const receitas = receitasResult.rows[0] || {};
      const detailsByType = detailsByTypeResult.rows || [];

      // Calcular valores
      const vendas_brutas = parseFloat(pedidos.vendas_brutas || 0);
      const descontos_totais = parseFloat(pedidos.descontos_totais || 0);
      const total_despesas_calc = parseFloat(despesas.total_despesas || 0);
      const receitas_extras_calc = parseFloat(receitas.receitas_extras || 0);
      const total_taxas_entrega_calc = detailsByType.reduce((sum, detail) => sum + parseFloat(detail.total_taxas_entrega || 0), 0);
      const saldo_final_calc = vendas_brutas + receitas_extras_calc - total_despesas_calc;

      console.log(`📊 Fechamento automático calculado - Pedidos: ${pedidos.total_pedidos}, Vendas: ${vendas_brutas}`);

      // Criar fechamento com dados calculados
      const result = await db.query(`
        INSERT INTO fechamento_caixa (
          data_fechamento, total_pedidos_dia, total_vendas, total_despesas_extras,
          total_receitas_extras, total_descontos, total_impostos, total_taxas_entrega,
          saldo_final, observacoes, vendas_por_metodo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        today,
        parseInt(pedidos.total_pedidos || 0),
        vendas_brutas,
        total_despesas_calc,
        receitas_extras_calc,
        descontos_totais,
        0, // impostos
        total_taxas_entrega_calc,
        saldo_final_calc,
        observacoes || `Fechamento automático gerado em ${new Date().toLocaleString('pt-BR')}`,
        JSON.stringify({
          dinheiro: { name: 'Dinheiro', total: parseFloat(pedidos.vendas_dinheiro || 0), count: parseInt(pedidos.pedidos_dinheiro || 0) },
          cartao: { name: 'Cartão', total: parseFloat(pedidos.vendas_cartao || 0), count: parseInt(pedidos.pedidos_cartao || 0) },
          pix: { name: 'PIX', total: parseFloat(pedidos.vendas_pix || 0), count: parseInt(pedidos.pedidos_pix || 0) },
          details_by_type: detailsByType
        })
      ]);

      // Invalidar caches relacionados ao fechamento de caixa
      invalidateCashClosingCaches(today);

      console.log(`✅ Fechamento automático criado com ID: ${result.rows[0].id}`);

      return res.status(201).json({ 
        cash_closing: result.rows[0],
        message: 'Fechamento automático criado com sucesso'
      });
    }

    // Fluxo manual (original)
    // Validações básicas
    if (!data_fechamento) {
      return res.status(400).json({ 
        error: 'Data de fechamento é obrigatória' 
      });
    }

    // Verificar se já foi fechado nesta data
    const existingClosing = await db.query(`
      SELECT id FROM fechamento_caixa 
      WHERE DATE(data_fechamento) = DATE($1)
    `, [data_fechamento]);
    
    if (existingClosing.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um fechamento para esta data' 
      });
    }

    // Criar estrutura de vendas por método incluindo detalhes por tipo
    const vendasPorMetodoCompleto = {
      ...vendas_por_metodo,
      details_by_type: details_by_type
    };

    const result = await db.query(`
      INSERT INTO fechamento_caixa (
        data_fechamento, total_pedidos_dia, total_vendas, total_despesas_extras,
        total_receitas_extras, total_descontos, total_impostos, total_taxas_entrega,
        saldo_final, observacoes, vendas_por_metodo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      data_fechamento,
      parseInt(total_pedidos || 0),
      parseFloat(total_vendas || 0),
      parseFloat(total_despesas_extras || 0),
      parseFloat(total_receitas_extras || 0),
      parseFloat(total_descontos || 0),
      parseFloat(total_impostos || 0),
      parseFloat(total_taxas_entrega || 0),
      parseFloat(saldo_final || 0),
      observacoes || null,
      JSON.stringify(vendasPorMetodoCompleto)
    ]);

    // Invalidar caches relacionados ao fechamento de caixa
    invalidateCashClosingCaches(data_fechamento);

    res.status(201).json({ 
      cash_closing: result.rows[0],
      message: 'Fechamento criado com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro ao criar fechamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Função para invalidar caches relacionados ao fechamento de caixa
 * Chamada sempre que um novo fechamento é criado
 */
function invalidateCashClosingCaches(data_fechamento) {
  try {
    // Invalidar cache do dia atual de forma simples
    cache.deletePattern('cash_closing:current:.*');
    cache.deletePattern('cash_closing:list:.*');
    cache.deletePattern('dashboard:.*');
    cache.deletePattern('reports:.*');
    
    console.log(`🧹 Invalidated cash closing caches for date: ${data_fechamento}`);
  } catch (error) {
    console.error('❌ Erro ao invalidar cache:', error);
    // Não propagar erro de cache para não quebrar a operação principal
  }
}

// PATCH /api/cash-closing/:id - Atualizar fechamento (apenas observações)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;

    // Verificar se fechamento existe
    const existingClosing = await db.query('SELECT id FROM fechamento_caixa WHERE id = $1', [id]);
    if (existingClosing.rows.length === 0) {
      return res.status(404).json({ error: 'Fechamento não encontrado' });
    }

    const result = await db.query(`
      UPDATE fechamento_caixa 
      SET observacoes = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [observacoes, id]);

    // Invalidar cache do fechamento específico
    cache.delete(CacheKeys.CASH_CLOSING_BY_ID(id));

    res.json({ cash_closing: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar fechamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/cash-closing/:id - Deletar fechamento (apenas admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se fechamento existe
    const existingClosing = await db.query('SELECT data_fechamento FROM fechamento_caixa WHERE id = $1', [id]);
    if (existingClosing.rows.length === 0) {
      return res.status(404).json({ error: 'Fechamento não encontrado' });
    }

    const dataFechamento = existingClosing.rows[0].data_fechamento;

    await db.query('DELETE FROM fechamento_caixa WHERE id = $1', [id]);
    
    // Invalidar caches relacionados
    invalidateCashClosingCaches(dataFechamento);

    res.json({ message: 'Fechamento removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar fechamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// ==================== ROTAS DE FECHAMENTO SEPARADO (SUBMÓDULO) ====================

// GET /api/cash-closing/separate/summary/:date - Buscar resumo separado por tipo
router.get('/separate/summary/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    // Buscar pedidos delivery do dia
    const deliveryData = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(SUM(desconto_aplicado), 0) as descontos_totais,
        COALESCE(SUM(taxa_entrega), 0) as total_taxas_entrega,
        COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
        COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
        COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at)) = $1 
        AND status_pedido IN ('entregue', 'fechada')
        AND tipo_pedido = 'delivery'
    `, [date]);

    // Buscar pedidos mesa do dia
    const mesaData = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as vendas_brutas,
        COALESCE(SUM(desconto_aplicado), 0) as descontos_totais,
        COUNT(CASE WHEN forma_pagamento = 'dinheiro' THEN 1 END) as pedidos_dinheiro,
        COUNT(CASE WHEN forma_pagamento = 'cartao' THEN 1 END) as pedidos_cartao,
        COUNT(CASE WHEN forma_pagamento = 'pix' THEN 1 END) as pedidos_pix,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as vendas_dinheiro,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as vendas_cartao,
        COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as vendas_pix
      FROM pedidos 
      WHERE DATE(COALESCE(data_pedido, created_at)) = $1 
        AND status_pedido IN ('entregue', 'fechada')
        AND tipo_pedido = 'mesa'
    `, [date]);

    // Buscar despesas e receitas (compartilhadas)
    const [despesasResult, receitasResult] = await Promise.all([
      db.query(`
        SELECT COALESCE(SUM(valor), 0) as total_despesas
        FROM despesas_receitas 
        WHERE DATE(data_transacao) = $1 
          AND tipo = 'despesa'
      `, [date]),
      
      db.query(`
        SELECT COALESCE(SUM(valor), 0) as receitas_extras
        FROM despesas_receitas 
        WHERE DATE(data_transacao) = $1 
          AND tipo = 'receita'
      `, [date])
    ]);

    const delivery = deliveryData.rows[0];
    const mesa = mesaData.rows[0];
    const despesas = despesasResult.rows[0];
    const receitas = receitasResult.rows[0];

    // Calcular dados para delivery
    const deliveryVendasLiquidas = parseFloat(delivery.vendas_brutas) - parseFloat(delivery.descontos_totais);
    const deliverySaldoFinal = deliveryVendasLiquidas + parseFloat(receitas.receitas_extras) / 2 - parseFloat(despesas.total_despesas) / 2;

    // Calcular dados para mesa
    const mesaVendasLiquidas = parseFloat(mesa.vendas_brutas) - parseFloat(mesa.descontos_totais);
    const mesaSaldoFinal = mesaVendasLiquidas + parseFloat(receitas.receitas_extras) / 2 - parseFloat(despesas.total_despesas) / 2;

    const deliverySummary = {
      tipo: 'delivery',
      data_fechamento: date,
      total_pedidos: parseInt(delivery.total_pedidos),
      vendas_brutas: parseFloat(delivery.vendas_brutas),
      descontos_totais: parseFloat(delivery.descontos_totais),
      vendas_liquidas: deliveryVendasLiquidas,
      total_taxas_entrega: parseFloat(delivery.total_taxas_entrega),
      vendas_dinheiro: parseFloat(delivery.vendas_dinheiro),
      vendas_cartao: parseFloat(delivery.vendas_cartao),
      vendas_pix: parseFloat(delivery.vendas_pix),
      pedidos_dinheiro: parseInt(delivery.pedidos_dinheiro),
      pedidos_cartao: parseInt(delivery.pedidos_cartao),
      pedidos_pix: parseInt(delivery.pedidos_pix),
      total_despesas: parseFloat(despesas.total_despesas) / 2,
      receitas_extras: parseFloat(receitas.receitas_extras) / 2,
      saldo_final: deliverySaldoFinal
    };

    const mesaSummary = {
      tipo: 'mesa',
      data_fechamento: date,
      total_pedidos: parseInt(mesa.total_pedidos),
      vendas_brutas: parseFloat(mesa.vendas_brutas),
      descontos_totais: parseFloat(mesa.descontos_totais),
      vendas_liquidas: mesaVendasLiquidas,
      total_taxas_entrega: 0, // Mesa não tem taxa de entrega
      vendas_dinheiro: parseFloat(mesa.vendas_dinheiro),
      vendas_cartao: parseFloat(mesa.vendas_cartao),
      vendas_pix: parseFloat(mesa.vendas_pix),
      pedidos_dinheiro: parseInt(mesa.pedidos_dinheiro),
      pedidos_cartao: parseInt(mesa.pedidos_cartao),
      pedidos_pix: parseInt(mesa.pedidos_pix),
      total_despesas: parseFloat(despesas.total_despesas) / 2,
      receitas_extras: parseFloat(receitas.receitas_extras) / 2,
      saldo_final: mesaSaldoFinal
    };

    res.json({ 
      delivery: deliverySummary,
      mesa: mesaSummary,
      despesas_totais: parseFloat(despesas.total_despesas),
      receitas_totais: parseFloat(receitas.receitas_extras)
    });

  } catch (error) {
    console.error('Erro ao buscar resumo separado:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/cash-closing/separate/history - Buscar histórico de fechamentos separados
router.get('/separate/history', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    let query = `
      SELECT * FROM fechamento_caixa 
      WHERE tipo_fechamento IN ('delivery', 'mesa')
    `;
    const params = [];
    let paramIndex = 1;

    if (data_inicio) {
      query += ` AND data_fechamento >= $${paramIndex++}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND data_fechamento <= $${paramIndex++}`;
      params.push(data_fim);
    }

    query += ' ORDER BY data_fechamento DESC, tipo_fechamento ASC';

    const result = await db.query(query, params);
    res.json({ fechamentos: result.rows });
  } catch (error) {
    console.error('Erro ao buscar histórico separado:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/cash-closing/separate/close - Fechar caixa de um tipo específico
router.post('/separate/close', authenticateToken, async (req, res) => {
  try {
    const { 
      tipo_fechamento,
      data_fechamento,
      total_pedidos,
      total_vendas,
      total_despesas_extras,
      total_receitas_extras,
      total_descontos,
      total_impostos = 0,
      total_taxas_entrega,
      saldo_final,
      observacoes,
      vendas_por_metodo = {}
    } = req.body;

    // Validações básicas
    if (!tipo_fechamento || !['delivery', 'mesa'].includes(tipo_fechamento)) {
      return res.status(400).json({ 
        error: 'Tipo de fechamento deve ser "delivery" ou "mesa"' 
      });
    }

    if (!data_fechamento) {
      return res.status(400).json({ 
        error: 'Data de fechamento é obrigatória' 
      });
    }

    // Verificar se já foi fechado nesta data e tipo
    const existingClosing = await db.query(`
      SELECT id FROM fechamento_caixa
      WHERE DATE(data_fechamento) = $1 AND tipo_fechamento = $2
    `, [data_fechamento, tipo_fechamento]);

    if (existingClosing.rows.length > 0) {
      return res.status(400).json({ 
        error: `Fechamento de ${tipo_fechamento} já foi realizado para a data ${data_fechamento}` 
      });
    }

    // Inserir fechamento separado
    const result = await db.query(`
      INSERT INTO fechamento_caixa (
        data_fechamento,
        tipo_fechamento,
        total_pedidos_dia,
        total_vendas,
        total_despesas_extras,
        total_receitas_extras,
        total_descontos,
        total_impostos,
        total_taxas_entrega,
        saldo_final,
        observacoes,
        vendas_por_metodo,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `, [
      data_fechamento,
      tipo_fechamento,
      total_pedidos,
      total_vendas,
      total_despesas_extras,
      total_receitas_extras,
      total_descontos,
      total_impostos,
      total_taxas_entrega,
      saldo_final,
      observacoes,
      JSON.stringify(vendas_por_metodo)
    ]);

    console.log(`✅ Fechamento ${tipo_fechamento} criado:`, result.rows[0].id);

    res.status(201).json({ 
      message: `Fechamento de ${tipo_fechamento} realizado com sucesso`,
      cash_closing: result.rows[0] 
    });

  } catch (error) {
    console.error('Erro ao criar fechamento separado:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// ==================== ROTAS DE FECHAMENTO INTEGRADO (CONTINUAÇÃO) ====================

module.exports = router; 