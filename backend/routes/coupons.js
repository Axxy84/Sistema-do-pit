const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/coupons - Listar todos os cupons
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM cupons 
      ORDER BY created_at DESC
    `);
    res.json({ coupons: result.rows });
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/coupons/active - Listar apenas cupons ativos
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM cupons 
      WHERE ativo = true 
        AND (data_validade IS NULL OR data_validade >= NOW())
        AND (usos_maximos IS NULL OR usos_atuais < usos_maximos)
      ORDER BY created_at DESC
    `);
    res.json({ coupons: result.rows });
  } catch (error) {
    console.error('Erro ao buscar cupons ativos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/coupons/:id - Buscar cupom por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM cupons WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }
    
    res.json({ coupon: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar cupom:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/coupons/code/:code - Buscar cupom por código
router.get('/code/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const result = await db.query(
      'SELECT * FROM cupons WHERE UPPER(codigo) = UPPER($1)',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }
    
    res.json({ coupon: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar cupom por código:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/coupons/validate - Validar cupom por código
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { codigo, valor_pedido = 0 } = req.body;

    if (!codigo) {
      return res.status(400).json({ error: 'Código do cupom é obrigatório' });
    }

    const result = await db.query(`
      SELECT * FROM cupons 
      WHERE UPPER(codigo) = UPPER($1)
        AND ativo = true 
        AND (data_validade IS NULL OR data_validade >= NOW())
        AND (usos_maximos IS NULL OR usos_atuais < usos_maximos)
        AND (valor_minimo_pedido IS NULL OR valor_minimo_pedido <= $2)
    `, [codigo, valor_pedido]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Cupom inválido',
        message: 'Cupom não encontrado, expirado ou não aplicável a este pedido.' 
      });
    }
    
    res.json({ coupon: result.rows[0] });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/coupons - Criar novo cupom
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      codigo,
      descricao,
      tipo_desconto,
      valor_desconto,
      data_validade,
      usos_maximos,
      valor_minimo_pedido,
      ativo = true
    } = req.body;

    // Validações básicas
    if (!codigo || !tipo_desconto || !valor_desconto) {
      return res.status(400).json({ 
        error: 'Código, tipo de desconto e valor são obrigatórios' 
      });
    }

    if (!['percentual', 'valor_fixo'].includes(tipo_desconto)) {
      return res.status(400).json({ 
        error: 'Tipo de desconto deve ser "percentual" ou "valor_fixo"' 
      });
    }

    // Verificar se código já existe
    const existingCoupon = await db.query(
      'SELECT id FROM cupons WHERE UPPER(codigo) = UPPER($1)',
      [codigo]
    );
    
    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um cupom com este código' 
      });
    }

    const result = await db.query(`
      INSERT INTO cupons (
        codigo, descricao, tipo_desconto, valor_desconto, 
        data_validade, usos_maximos, valor_minimo_pedido, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      codigo.toUpperCase(), 
      descricao, 
      tipo_desconto, 
      valor_desconto,
      data_validade,
      usos_maximos,
      valor_minimo_pedido,
      ativo
    ]);

    res.status(201).json({ coupon: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/coupons/:id - Atualizar cupom
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      codigo, 
      descricao, 
      tipo_desconto, 
      valor_desconto,
      data_validade,
      usos_maximos,
      valor_minimo_pedido,
      ativo 
    } = req.body;

    // Verificar se cupom existe
    const existingCoupon = await db.query('SELECT id FROM cupons WHERE id = $1', [id]);
    if (existingCoupon.rows.length === 0) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }

    // Verificar se código já existe (em outro cupom)
    if (codigo) {
      const codeExists = await db.query(
        'SELECT id FROM cupons WHERE UPPER(codigo) = UPPER($1) AND id != $2',
        [codigo, id]
      );
      
      if (codeExists.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe outro cupom com este código' 
        });
      }
    }

    // Construir query dinâmica
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (codigo !== undefined) {
      fields.push(`codigo = $${paramIndex++}`);
      values.push(codigo.toUpperCase());
    }
    if (descricao !== undefined) {
      fields.push(`descricao = $${paramIndex++}`);
      values.push(descricao);
    }
    if (tipo_desconto !== undefined) {
      fields.push(`tipo_desconto = $${paramIndex++}`);
      values.push(tipo_desconto);
    }
    if (valor_desconto !== undefined) {
      fields.push(`valor_desconto = $${paramIndex++}`);
      values.push(valor_desconto);
    }
    if (data_validade !== undefined) {
      fields.push(`data_validade = $${paramIndex++}`);
      values.push(data_validade);
    }
    if (usos_maximos !== undefined) {
      fields.push(`usos_maximos = $${paramIndex++}`);
      values.push(usos_maximos);
    }
    if (valor_minimo_pedido !== undefined) {
      fields.push(`valor_minimo_pedido = $${paramIndex++}`);
      values.push(valor_minimo_pedido);
    }
    if (ativo !== undefined) {
      fields.push(`ativo = $${paramIndex++}`);
      values.push(ativo);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id); // Para o WHERE

    const query = `
      UPDATE cupons 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.json({ coupon: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/coupons/:id/use - Incrementar uso do cupom
router.patch('/:id/use', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE cupons 
      SET usos_atuais = usos_atuais + 1, updated_at = $1
      WHERE id = $2
      RETURNING *
    `, [new Date(), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }

    res.json({ coupon: result.rows[0] });

  } catch (error) {
    console.error('Erro ao incrementar uso do cupom:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/coupons/:id - Deletar cupom
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cupom existe
    const existingCoupon = await db.query('SELECT id FROM cupons WHERE id = $1', [id]);
    if (existingCoupon.rows.length === 0) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }

    // Verificar se cupom foi usado em pedidos
    const inUse = await db.query(`
      SELECT COUNT(*) as count 
      FROM pedidos 
      WHERE cupom_id = $1
    `, [id]);

    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cupom em uso',
        message: 'Este cupom não pode ser excluído pois foi usado em pedidos. Considere desativá-lo.'
      });
    }

    await db.query('DELETE FROM cupons WHERE id = $1', [id]);
    res.json({ message: 'Cupom removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 