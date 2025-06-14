const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Listar todas as bordas disponíveis
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, nome, preco_adicional
      FROM bordas
      WHERE disponivel = true
      ORDER BY nome
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      bordas: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao buscar bordas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar bordas'
    });
  }
});

// Buscar borda por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, nome, preco_adicional, disponivel, created_at, updated_at
      FROM bordas
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Borda não encontrada'
      });
    }
    
    res.json({
      success: true,
      borda: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar borda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar borda'
    });
  }
});

// Criar nova borda (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nome, preco_adicional } = req.body;
    
    // Validações
    if (!nome || preco_adicional === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Nome e preço são obrigatórios'
      });
    }
    
    if (preco_adicional < 0) {
      return res.status(400).json({
        success: false,
        error: 'Preço não pode ser negativo'
      });
    }
    
    // Verificar se já existe
    const checkQuery = 'SELECT id FROM bordas WHERE LOWER(nome) = LOWER($1)';
    const checkResult = await pool.query(checkQuery, [nome]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Borda com este nome já existe'
      });
    }
    
    // Inserir nova borda
    const insertQuery = `
      INSERT INTO bordas (nome, preco_adicional)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [nome, preco_adicional]);
    
    res.status(201).json({
      success: true,
      message: 'Borda criada com sucesso',
      borda: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar borda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar borda'
    });
  }
});

// Atualizar borda (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, preco_adicional, disponivel } = req.body;
    
    // Verificar se existe
    const checkQuery = 'SELECT id FROM bordas WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Borda não encontrada'
      });
    }
    
    // Montar query de atualização dinamicamente
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (nome !== undefined) {
      updates.push(`nome = $${paramCount}`);
      values.push(nome);
      paramCount++;
    }
    
    if (preco_adicional !== undefined) {
      if (preco_adicional < 0) {
        return res.status(400).json({
          success: false,
          error: 'Preço não pode ser negativo'
        });
      }
      updates.push(`preco_adicional = $${paramCount}`);
      values.push(preco_adicional);
      paramCount++;
    }
    
    if (disponivel !== undefined) {
      updates.push(`disponivel = $${paramCount}`);
      values.push(disponivel);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    const updateQuery = `
      UPDATE bordas
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, values);
    
    res.json({
      success: true,
      message: 'Borda atualizada com sucesso',
      borda: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar borda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar borda'
    });
  }
});

// Deletar borda (admin only) - soft delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se existe
    const checkQuery = 'SELECT id FROM bordas WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Borda não encontrada'
      });
    }
    
    // Soft delete - apenas marcar como indisponível
    const updateQuery = `
      UPDATE bordas
      SET disponivel = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id, nome
    `;
    
    const result = await pool.query(updateQuery, [id]);
    
    res.json({
      success: true,
      message: 'Borda removida com sucesso',
      borda: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao deletar borda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar borda'
    });
  }
});

module.exports = router;