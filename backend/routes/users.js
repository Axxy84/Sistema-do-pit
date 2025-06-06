const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar todos os usuários (apenas admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT u.id, u.email, u.created_at, p.full_name, p.role 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      users: rows.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter usuário específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário pode acessar este perfil
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { rows } = await db.query(`
      SELECT u.id, u.email, u.created_at, p.full_name, p.role 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil do usuário
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role } = req.body;
    
    // Verificar permissões
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Apenas admin pode alterar role
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar roles' });
    }

    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (full_name) {
      updates.push(`full_name = $${paramCounter++}`);
      values.push(full_name);
    }

    if (role && req.user.role === 'admin') {
      updates.push(`role = $${paramCounter++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE profiles 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Perfil atualizado com sucesso',
      profile: rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar usuário (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Não permitir deletar a si mesmo
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    const { rows } = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 