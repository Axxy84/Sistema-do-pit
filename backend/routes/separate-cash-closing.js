const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/separate-cash-closing/summary/:date - Buscar resumo dos dois tipos para uma data
router.get('/summary/:date', authenticateToken, async (req, res) => {
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
        AND status_pedido = 'entregue'
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
        AND status_pedido = 'entregue'
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

// GET /api/separate-cash-closing/history - Buscar histórico de fechamentos separados
router.get('/history', authenticateToken, async (req, res) => {
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

// POST /api/separate-cash-closing/close - Fechar caixa de um tipo específico
router.post('/close', authenticateToken, async (req, res) => {
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
      WHERE DATE(data_fechamento) = DATE($1) 
        AND tipo_fechamento = $2
    `, [data_fechamento, tipo_fechamento]);
    
    if (existingClosing.rows.length > 0) {
      return res.status(400).json({ 
        error: `Já existe um fechamento de ${tipo_fechamento} para esta data` 
      });
    }

    const result = await db.query(`
      INSERT INTO fechamento_caixa (
        data_fechamento, tipo_fechamento, total_pedidos_dia, total_vendas, total_despesas_extras,
        total_receitas_extras, total_descontos, total_impostos, total_taxas_entrega,
        saldo_final, observacoes, vendas_por_metodo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      data_fechamento,
      tipo_fechamento,
      parseInt(total_pedidos || 0),
      parseFloat(total_vendas || 0),
      parseFloat(total_despesas_extras || 0),
      parseFloat(total_receitas_extras || 0),
      parseFloat(total_descontos || 0),
      parseFloat(total_impostos || 0),
      parseFloat(total_taxas_entrega || 0),
      parseFloat(saldo_final || 0),
      observacoes,
      JSON.stringify(vendas_por_metodo)
    ]);

    res.status(201).json({ fechamento: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar fechamento separado:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 