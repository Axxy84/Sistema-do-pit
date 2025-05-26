const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses - Listar todas as despesas/receitas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tipo, data_inicio, data_fim } = req.query;
    
    let query = 'SELECT * FROM despesas_receitas WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (tipo && ['despesa', 'receita'].includes(tipo)) {
      query += ` AND tipo = $${paramIndex++}`;
      params.push(tipo);
    }

    if (data_inicio) {
      query += ` AND data_transacao >= $${paramIndex++}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND data_transacao <= $${paramIndex++}`;
      params.push(data_fim);
    }

    query += ' ORDER BY data_transacao DESC, created_at DESC';

    const result = await db.query(query, params);
    res.json({ expenses: result.rows });
  } catch (error) {
    console.error('Erro ao buscar despesas/receitas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/expenses/summary - Resumo financeiro
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (data_inicio && data_fim) {
      dateFilter = 'WHERE data_transacao BETWEEN $1 AND $2';
      params.push(data_inicio, data_fim);
    } else if (data_inicio) {
      dateFilter = 'WHERE data_transacao >= $1';
      params.push(data_inicio);
    } else if (data_fim) {
      dateFilter = 'WHERE data_transacao <= $1';
      params.push(data_fim);
    }

    const result = await db.query(`
      SELECT 
        tipo,
        COUNT(*) as quantidade,
        COALESCE(SUM(valor), 0) as total
      FROM despesas_receitas 
      ${dateFilter}
      GROUP BY tipo
    `, params);

    const summary = {
      total_despesas: 0,
      total_receitas: 0,
      quantidade_despesas: 0,
      quantidade_receitas: 0,
      saldo: 0
    };

    result.rows.forEach(row => {
      if (row.tipo === 'despesa') {
        summary.total_despesas = parseFloat(row.total);
        summary.quantidade_despesas = parseInt(row.quantidade);
      } else if (row.tipo === 'receita') {
        summary.total_receitas = parseFloat(row.total);
        summary.quantidade_receitas = parseInt(row.quantidade);
      }
    });

    summary.saldo = summary.total_receitas - summary.total_despesas;

    res.json({ summary });
  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/expenses/:id - Buscar despesa/receita por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM despesas_receitas WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar despesa/receita:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/expenses - Criar nova despesa/receita
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tipo, valor, descricao, data_transacao } = req.body;

    // Validações básicas
    if (!tipo || !valor || !descricao || !data_transacao) {
      return res.status(400).json({ 
        error: 'Tipo, valor, descrição e data são obrigatórios' 
      });
    }

    if (!['despesa', 'receita'].includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo deve ser "despesa" ou "receita"' 
      });
    }

    if (parseFloat(valor) <= 0) {
      return res.status(400).json({ 
        error: 'Valor deve ser maior que zero' 
      });
    }

    const result = await db.query(`
      INSERT INTO despesas_receitas (tipo, valor, descricao, data_transacao)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [tipo, parseFloat(valor), descricao, data_transacao]);

    res.status(201).json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar despesa/receita:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/expenses/:id - Atualizar despesa/receita
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, valor, descricao, data_transacao } = req.body;

    // Verificar se registro existe
    const existingRecord = await db.query('SELECT id FROM despesas_receitas WHERE id = $1', [id]);
    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    // Validações
    if (tipo && !['despesa', 'receita'].includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo deve ser "despesa" ou "receita"' 
      });
    }

    if (valor && parseFloat(valor) <= 0) {
      return res.status(400).json({ 
        error: 'Valor deve ser maior que zero' 
      });
    }

    // Construir query dinâmica
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (tipo !== undefined) {
      fields.push(`tipo = $${paramIndex++}`);
      values.push(tipo);
    }
    if (valor !== undefined) {
      fields.push(`valor = $${paramIndex++}`);
      values.push(parseFloat(valor));
    }
    if (descricao !== undefined) {
      fields.push(`descricao = $${paramIndex++}`);
      values.push(descricao);
    }
    if (data_transacao !== undefined) {
      fields.push(`data_transacao = $${paramIndex++}`);
      values.push(data_transacao);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id); // Para o WHERE

    const query = `
      UPDATE despesas_receitas 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.json({ expense: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar despesa/receita:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/expenses/:id - Deletar despesa/receita
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se registro existe
    const existingRecord = await db.query('SELECT id FROM despesas_receitas WHERE id = $1', [id]);
    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    await db.query('DELETE FROM despesas_receitas WHERE id = $1', [id]);
    res.json({ message: 'Registro removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar despesa/receita:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 