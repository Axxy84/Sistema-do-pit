const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const cache = require('../cache/cache-manager');
const { CacheKeys, getPeriodKey, getDateKey } = require('../cache/cache-keys');

const router = express.Router();

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

// GET /api/cash-closing/current - Dados para fechamento do dia atual
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayKey = getDateKey(today);
    const cacheKey = CacheKeys.CASH_CLOSING_CURRENT(todayKey);
    
    // Para dados do dia atual, cache mais curto pois mudam frequentemente
    const cashClosingData = await cache.getOrFetch(cacheKey, async () => {
      // Verificar se já foi fechado hoje
      const existingClosing = await db.query(`
        SELECT * FROM fechamento_caixa 
        WHERE DATE(data_fechamento) = $1
      `, [today]);

      if (existingClosing.rows.length > 0) {
        return { 
          cash_closing: existingClosing.rows[0],
          already_closed: true 
        };
      }

      // Buscar dados do dia
      const [pedidosResult, despesasResult, receitasResult] = await Promise.all([
        // Pedidos do dia
        db.query(`
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
            AND status_pedido = 'entregue'
        `, [today]),
        
        // Despesas do dia
        db.query(`
          SELECT COALESCE(SUM(valor), 0) as total_despesas
          FROM despesas_receitas 
          WHERE DATE(data_transacao) = $1 
            AND tipo = 'despesa'
        `, [today]),
        
        // Receitas do dia (extras, não dos pedidos)
        db.query(`
          SELECT COALESCE(SUM(valor), 0) as receitas_extras
          FROM despesas_receitas 
          WHERE DATE(data_transacao) = $1 
            AND tipo = 'receita'
        `, [today])
      ]);

      const pedidos = pedidosResult.rows[0];
      const despesas = despesasResult.rows[0];
      const receitas = receitasResult.rows[0];

      const vendas_liquidas = parseFloat(pedidos.vendas_brutas) - parseFloat(pedidos.descontos_totais);
      const receita_total = vendas_liquidas + parseFloat(receitas.receitas_extras);
      const saldo_final = receita_total - parseFloat(despesas.total_despesas);

      const currentData = {
        data_fechamento: today,
        total_pedidos: parseInt(pedidos.total_pedidos),
        vendas_brutas: parseFloat(pedidos.vendas_brutas),
        descontos_totais: parseFloat(pedidos.descontos_totais),
        vendas_liquidas: vendas_liquidas,
        vendas_dinheiro: parseFloat(pedidos.vendas_dinheiro),
        vendas_cartao: parseFloat(pedidos.vendas_cartao),
        vendas_pix: parseFloat(pedidos.vendas_pix),
        pedidos_dinheiro: parseInt(pedidos.pedidos_dinheiro),
        pedidos_cartao: parseInt(pedidos.pedidos_cartao),
        pedidos_pix: parseInt(pedidos.pedidos_pix),
        total_despesas: parseFloat(despesas.total_despesas),
        receitas_extras: parseFloat(receitas.receitas_extras),
        receita_total: receita_total,
        saldo_final: saldo_final
      };

      return { 
        cash_closing: currentData,
        already_closed: false 
      };
    }, 120); // Cache por apenas 2 minutos (dados do dia mudam frequentemente)

    res.json(cashClosingData);

  } catch (error) {
    console.error('Erro ao buscar dados atuais:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
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

// POST /api/cash-closing - Criar novo fechamento
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
      vendas_por_metodo = {}
    } = req.body;

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
      JSON.stringify(vendas_por_metodo)
    ]);

    // Invalidar caches relacionados ao fechamento de caixa
    invalidateCashClosingCaches(data_fechamento);

    res.status(201).json({ 
      cash_closing: result.rows[0],
      message: 'Fechamento criado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao criar fechamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

/**
 * Função para invalidar caches relacionados ao fechamento de caixa
 * Chamada sempre que um novo fechamento é criado
 */
function invalidateCashClosingCaches(data_fechamento) {
  // Invalidar cache do dia atual
  const todayKey = getDateKey(data_fechamento);
  cache.delete(CacheKeys.CASH_CLOSING_CURRENT(todayKey));
  
  // Invalidar cache de listagem de fechamentos
  cache.deletePattern(CacheKeys.PATTERNS.CASH_CLOSING);
  
  // Invalidar caches de dashboard e relatórios que dependem de fechamentos
  cache.deletePattern(CacheKeys.PATTERNS.DASHBOARD);
  cache.deletePattern(CacheKeys.PATTERNS.REPORTS);
  
  console.log(`🧹 Invalidated cash closing caches for date: ${data_fechamento}`);
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
    const existingClosing = await db.query('SELECT id FROM fechamento_caixa WHERE id = $1', [id]);
    if (existingClosing.rows.length === 0) {
      return res.status(404).json({ error: 'Fechamento não encontrado' });
    }

    await db.query('DELETE FROM fechamento_caixa WHERE id = $1', [id]);
    res.json({ message: 'Fechamento removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar fechamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 