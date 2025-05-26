const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Buscar dados atualizados do usuário
    const { rows } = await db.query(`
      SELECT u.id, u.email, p.full_name, p.role 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.id = $1
    `, [decoded.userId]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Necessário ter um dos seguintes papéis: ${roles.join(', ')}`
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin
}; 