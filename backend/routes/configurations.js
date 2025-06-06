const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/configurations - Listar todas as configurações
router.get('/', authenticateToken, async (req, res) => {
  try {
    const configurationsResult = await db.query(`
      SELECT id, chave, valor, descricao, tipo, ativo, created_at, updated_at
      FROM configuracoes 
      WHERE ativo = true
      ORDER BY chave
    `);

    res.json({ configurations: configurationsResult.rows });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/configurations/:chave - Buscar configuração específica
router.get('/:chave', authenticateToken, async (req, res) => {
  try {
    const { chave } = req.params;
    
    const configResult = await db.query(`
      SELECT id, chave, valor, descricao, tipo, ativo, created_at, updated_at
      FROM configuracoes 
      WHERE chave = $1 AND ativo = true
    `, [chave]);

    if (configResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Configuração não encontrada' 
      });
    }

    res.json({ configuration: configResult.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PUT /api/configurations/:chave - Atualizar configuração
router.put('/:chave', authenticateToken, async (req, res) => {
  try {
    const { chave } = req.params;
    const { valor, descricao } = req.body;

    if (!valor) {
      return res.status(400).json({ 
        error: 'Valor da configuração é obrigatório' 
      });
    }

    const updateResult = await db.query(`
      UPDATE configuracoes 
      SET valor = $2, 
          descricao = COALESCE($3, descricao),
          updated_at = NOW()
      WHERE chave = $1 AND ativo = true
      RETURNING *
    `, [chave, valor, descricao]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Configuração não encontrada' 
      });
    }

    console.log(`✅ Configuração ${chave} atualizada com sucesso`);

    res.json({ 
      message: 'Configuração atualizada com sucesso',
      configuration: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/configurations - Criar nova configuração
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { chave, valor, descricao, tipo = 'texto' } = req.body;

    if (!chave || !valor) {
      return res.status(400).json({ 
        error: 'Chave e valor da configuração são obrigatórios' 
      });
    }

    // Verificar se já existe
    const existingConfig = await db.query(`
      SELECT id FROM configuracoes WHERE chave = $1
    `, [chave]);

    if (existingConfig.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Configuração com esta chave já existe' 
      });
    }

    const insertResult = await db.query(`
      INSERT INTO configuracoes (chave, valor, descricao, tipo) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [chave, valor, descricao, tipo]);

    console.log(`✅ Nova configuração ${chave} criada com sucesso`);

    res.status(201).json({ 
      message: 'Configuração criada com sucesso',
      configuration: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/configurations/:chave - Desativar configuração
router.delete('/:chave', authenticateToken, async (req, res) => {
  try {
    const { chave } = req.params;
    
    const updateResult = await db.query(`
      UPDATE configuracoes 
      SET ativo = false, updated_at = NOW()
      WHERE chave = $1
      RETURNING *
    `, [chave]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Configuração não encontrada' 
      });
    }

    console.log(`✅ Configuração ${chave} desativada com sucesso`);

    res.json({ 
      message: 'Configuração desativada com sucesso',
      configuration: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao desativar configuração:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 