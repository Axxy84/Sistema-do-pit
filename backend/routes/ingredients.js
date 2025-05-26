const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/ingredients - Listar todos os ingredientes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM ingredientes 
      ORDER BY nome ASC
    `);
    res.json({ ingredients: result.rows });
  } catch (error) {
    console.error('Erro ao buscar ingredientes:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/ingredients/:id - Buscar ingrediente por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM ingredientes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }
    
    res.json({ ingredient: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar ingrediente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/ingredients - Criar novo ingrediente
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      nome, 
      unidade_medida, 
      quantidade_estoque = 0, 
      quantidade_minima = 0, 
      custo_unitario = 0 
    } = req.body;

    // Validações básicas
    if (!nome || !unidade_medida) {
      return res.status(400).json({ 
        error: 'Nome e unidade de medida são obrigatórios' 
      });
    }

    // Verificar se ingrediente já existe
    const existingIngredient = await db.query(
      'SELECT id FROM ingredientes WHERE LOWER(nome) = LOWER($1)',
      [nome]
    );
    
    if (existingIngredient.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um ingrediente com este nome' 
      });
    }

    const result = await db.query(`
      INSERT INTO ingredientes (nome, unidade_medida, quantidade_estoque, quantidade_minima, custo_unitario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nome, unidade_medida, quantidade_estoque, quantidade_minima, custo_unitario]);

    res.status(201).json({ ingredient: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar ingrediente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/ingredients/:id - Atualizar ingrediente
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, unidade_medida, quantidade_estoque, quantidade_minima, custo_unitario } = req.body;

    // Verificar se ingrediente existe
    const existingIngredient = await db.query('SELECT id FROM ingredientes WHERE id = $1', [id]);
    if (existingIngredient.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }

    // Verificar se nome já existe (em outro ingrediente)
    if (nome) {
      const nameExists = await db.query(
        'SELECT id FROM ingredientes WHERE LOWER(nome) = LOWER($1) AND id != $2',
        [nome, id]
      );
      
      if (nameExists.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe outro ingrediente com este nome' 
        });
      }
    }

    // Construir query dinâmica
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(nome);
    }
    if (unidade_medida !== undefined) {
      fields.push(`unidade_medida = $${paramIndex++}`);
      values.push(unidade_medida);
    }
    if (quantidade_estoque !== undefined) {
      fields.push(`quantidade_estoque = $${paramIndex++}`);
      values.push(quantidade_estoque);
    }
    if (quantidade_minima !== undefined) {
      fields.push(`quantidade_minima = $${paramIndex++}`);
      values.push(quantidade_minima);
    }
    if (custo_unitario !== undefined) {
      fields.push(`custo_unitario = $${paramIndex++}`);
      values.push(custo_unitario);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id); // Para o WHERE

    const query = `
      UPDATE ingredientes 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.json({ ingredient: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar ingrediente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/ingredients/:id/stock - Atualizar apenas estoque
router.patch('/:id/stock', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade_estoque, operacao = 'set' } = req.body; // 'set', 'add', 'subtract'

    // Verificar se ingrediente existe
    const existingIngredient = await db.query('SELECT * FROM ingredientes WHERE id = $1', [id]);
    if (existingIngredient.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }

    let newQuantity = quantidade_estoque;
    
    if (operacao === 'add') {
      newQuantity = parseFloat(existingIngredient.rows[0].quantidade_estoque) + parseFloat(quantidade_estoque);
    } else if (operacao === 'subtract') {
      newQuantity = parseFloat(existingIngredient.rows[0].quantidade_estoque) - parseFloat(quantidade_estoque);
    }

    // Não permitir estoque negativo
    if (newQuantity < 0) {
      return res.status(400).json({ 
        error: 'Estoque não pode ser negativo' 
      });
    }

    const result = await db.query(`
      UPDATE ingredientes 
      SET quantidade_estoque = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `, [newQuantity, new Date(), id]);

    res.json({ ingredient: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/ingredients/:id - Deletar ingrediente
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se ingrediente existe
    const existingIngredient = await db.query('SELECT id FROM ingredientes WHERE id = $1', [id]);
    if (existingIngredient.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }

    // Verificar se ingrediente está sendo usado em produtos
    const inUse = await db.query(`
      SELECT COUNT(*) as count 
      FROM produtos_ingredientes 
      WHERE ingrediente_id = $1
    `, [id]);

    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Ingrediente em uso',
        message: 'Este ingrediente não pode ser excluído pois está sendo usado em produtos.'
      });
    }

    await db.query('DELETE FROM ingredientes WHERE id = $1', [id]);
    res.json({ message: 'Ingrediente removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar ingrediente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/ingredients/low-stock - Listar ingredientes com estoque baixo
router.get('/reports/low-stock', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM ingredientes 
      WHERE quantidade_estoque <= quantidade_minima
      ORDER BY quantidade_estoque ASC
    `);
    res.json({ ingredients: result.rows });
  } catch (error) {
    console.error('Erro ao buscar ingredientes com estoque baixo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 