const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/clients - Listar todos os clientes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM clientes 
      ORDER BY created_at DESC
    `);
    res.json({ clients: result.rows });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/clients/:id - Buscar cliente por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json({ client: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/clients/:id/points - Buscar pontos do cliente
router.get('/:id/points', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se cliente existe
    const clientExists = await db.query('SELECT id FROM clientes WHERE id = $1', [id]);
    if (clientExists.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Buscar pontos (assumindo uma tabela de pontos ou calculando dos pedidos)
    const pointsResult = await db.query(`
      SELECT COALESCE(SUM(pontos_ganhos - pontos_resgatados), 0) as points
      FROM pedidos 
      WHERE cliente_id = $1 AND status_pedido = 'entregue'
    `, [id]);
    
    res.json({ points: parseInt(pointsResult.rows[0]?.points || 0) });
  } catch (error) {
    console.error('Erro ao buscar pontos do cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/clients - Criar novo cliente
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nome, telefone, endereco, email } = req.body;

    // Validações básicas
    if (!nome || !telefone) {
      return res.status(400).json({ 
        error: 'Nome e telefone são obrigatórios' 
      });
    }

    // Verificar se telefone já existe
    const existingClient = await db.query(
      'SELECT id FROM clientes WHERE telefone = $1',
      [telefone]
    );
    
    if (existingClient.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um cliente com este telefone' 
      });
    }

    const result = await db.query(`
      INSERT INTO clientes (nome, telefone, endereco, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [nome, telefone, endereco, email]);

    res.status(201).json({ client: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PATCH /api/clients/:id - Atualizar cliente
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, endereco, email } = req.body;

    // Verificar se cliente existe
    const existingClient = await db.query('SELECT id FROM clientes WHERE id = $1', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se telefone já existe (em outro cliente)
    if (telefone) {
      const phoneExists = await db.query(
        'SELECT id FROM clientes WHERE telefone = $1 AND id != $2',
        [telefone, id]
      );
      
      if (phoneExists.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe outro cliente com este telefone' 
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
    if (endereco !== undefined) {
      fields.push(`endereco = $${paramIndex++}`);
      values.push(endereco);
    }
    if (email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id); // Para o WHERE

    const query = `
      UPDATE clientes 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.json({ client: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/clients/:id - Deletar cliente
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cliente existe
    const existingClient = await db.query('SELECT id FROM clientes WHERE id = $1', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se cliente tem pedidos
    const hasOrders = await db.query(`
      SELECT COUNT(*) as count 
      FROM pedidos 
      WHERE cliente_id = $1
    `, [id]);

    if (parseInt(hasOrders.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cliente tem pedidos associados',
        message: 'Este cliente não pode ser excluído pois possui pedidos no histórico.'
      });
    }

    await db.query('DELETE FROM clientes WHERE id = $1', [id]);
    res.json({ message: 'Cliente removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 