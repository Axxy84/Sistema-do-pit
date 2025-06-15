const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const cache = require('../cache/cache-manager');
const { CacheKeys } = require('../cache/cache-keys');

const router = express.Router();

// GET /api/deliverers - Listar todos os entregadores (COM CACHE)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cacheKey = CacheKeys.DELIVERERS_LIST;
    
    // Cache-Aside pattern para lista de entregadores
    const deliverers = await cache.getOrFetch(cacheKey, async () => {
      const result = await db.query(`
        SELECT * FROM entregadores 
        ORDER BY nome ASC
      `);
      return result.rows;
    }, 600); // TTL: 10 minutos - dados mudam pouco
    
    res.json({ deliverers });
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/deliverers/active - Listar apenas entregadores ativos (COM CACHE)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const cacheKey = CacheKeys.DELIVERERS_ACTIVE;
    
    // Cache-Aside pattern para entregadores ativos (muito usado)
    const deliverers = await cache.getOrFetch(cacheKey, async () => {
      const result = await db.query(`
        SELECT * FROM entregadores 
        WHERE ativo = true
        ORDER BY nome ASC
      `);
      return result.rows;
    }, 900); // TTL: 15 minutos - entregadores ativos mudam raramente
    
    res.json({ deliverers });
  } catch (error) {
    console.error('Erro ao buscar entregadores ativos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/deliverers/:id - Buscar entregador por ID (COM CACHE)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CacheKeys.DELIVERERS_BY_ID(id);
    
    // Cache-Aside pattern para entregador individual
    const deliverer = await cache.getOrFetch(cacheKey, async () => {
      const result = await db.query('SELECT * FROM entregadores WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    }, 1200); // TTL: 20 minutos - dados individuais mudam muito pouco
    
    if (!deliverer) {
      return res.status(404).json({ error: 'Entregador não encontrado' });
    }
    
    res.json({ deliverer });
  } catch (error) {
    console.error('Erro ao buscar entregador:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/deliverers - Criar novo entregador
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nome, telefone, ativo = true } = req.body;

    // Validações básicas
    if (!nome) {
      return res.status(400).json({ 
        error: 'Nome é obrigatório' 
      });
    }

    // Verificar se telefone já existe (se fornecido)
    if (telefone) {
      const existingDeliverer = await db.query(
        'SELECT id FROM entregadores WHERE telefone = $1',
        [telefone]
      );
      
      if (existingDeliverer.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe um entregador com este telefone' 
        });
      }
    }

    const result = await db.query(`
      INSERT INTO entregadores (nome, telefone, ativo)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [nome, telefone, ativo]);

    // Invalidar cache após criação
    cache.deletePattern('deliverers:.*');
    console.log('💥 Cache invalidated: deliverers patterns (CREATE)');
    
    res.status(201).json({ deliverer: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar entregador:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/deliverers/:id - Atualizar entregador
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, ativo } = req.body;

    // Verificar se entregador existe
    const existingDeliverer = await db.query('SELECT id FROM entregadores WHERE id = $1', [id]);
    if (existingDeliverer.rows.length === 0) {
      return res.status(404).json({ error: 'Entregador não encontrado' });
    }

    // Verificar se telefone já existe (em outro entregador)
    if (telefone) {
      const phoneExists = await db.query(
        'SELECT id FROM entregadores WHERE telefone = $1 AND id != $2',
        [telefone, id]
      );
      
      if (phoneExists.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe outro entregador com este telefone' 
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
    if (telefone !== undefined) {
      fields.push(`telefone = $${paramIndex++}`);
      values.push(telefone);
    }
    if (ativo !== undefined) {
      fields.push(`ativo = $${paramIndex++}`);
      values.push(ativo);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id); // Para o WHERE

    const query = `
      UPDATE entregadores 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    // Invalidar cache após atualização
    cache.delete(CacheKeys.DELIVERERS_BY_ID(id));
    cache.deletePattern('deliverers:.*');
    console.log(`💥 Cache invalidated: deliverer ${id} and patterns (UPDATE)`);
    
    res.json({ deliverer: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar entregador:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/deliverers/:id - Deletar entregador
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se entregador existe
    const existingDeliverer = await db.query('SELECT id FROM entregadores WHERE id = $1', [id]);
    if (existingDeliverer.rows.length === 0) {
      return res.status(404).json({ error: 'Entregador não encontrado' });
    }

    // Verificar se entregador tem pedidos
    const hasOrders = await db.query(`
      SELECT COUNT(*) as count 
      FROM pedidos 
      WHERE entregador_id = $1
    `, [id]);

    if (parseInt(hasOrders.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Entregador tem pedidos associados',
        message: 'Este entregador não pode ser excluído pois possui pedidos no histórico. Considere desativá-lo.'
      });
    }

    await db.query('DELETE FROM entregadores WHERE id = $1', [id]);
    
    // Invalidar cache após deleção
    cache.delete(CacheKeys.DELIVERERS_BY_ID(id));
    cache.deletePattern('deliverers:.*');
    console.log(`💥 Cache invalidated: deliverer ${id} and patterns (DELETE)`);
    
    res.json({ message: 'Entregador removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar entregador:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 