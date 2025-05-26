const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const config = require('../config/env');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Função para gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { 
    expiresIn: config.JWT_EXPIRES_IN 
  });
};

// Cadastro de usuário
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role = 'atendente' } = req.body;

    // Validações
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        error: 'Email, senha e nome completo são obrigatórios' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'A senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Verificar se o email já existe
    const { rows: existingUsers } = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'Este email já está cadastrado' 
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Iniciar transação
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Criar usuário
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email.toLowerCase(), passwordHash]
      );

      const userId = userResult.rows[0].id;

      // Criar perfil
      await client.query(
        'INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3)',
        [userId, fullName, role]
      );

      await client.query('COMMIT');

      // Buscar dados completos do usuário
      const { rows } = await db.query(`
        SELECT u.id, u.email, p.full_name, p.role 
        FROM users u
        JOIN profiles p ON u.id = p.id
        WHERE u.id = $1
      `, [userId]);

      const user = rows[0];
      const token = generateToken(userId);

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o usuário'
    });
  }
});

// Login de usuário
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar usuário
    const { rows } = await db.query(`
      SELECT u.id, u.email, u.password_hash, p.full_name, p.role 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.email = $1
    `, [email.toLowerCase()]);

    if (rows.length === 0) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    const user = rows[0];

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível fazer login'
    });
  }
});

// Verificar token/sessão atual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// Logout (cliente-side pode apenas descartar o token)
router.post('/signout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Alterar senha
router.patch('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Senha atual e nova senha são obrigatórias' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'A nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Buscar senha atual
    const { rows } = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword, 
      rows[0].password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        error: 'Senha atual incorreta' 
      });
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

module.exports = router; 