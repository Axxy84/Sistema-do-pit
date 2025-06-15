const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware para verificar se o usuário tem acesso de owner (Tony Page)
const authenticateOwner = async (req, res, next) => {
  try {
    // Primeiro verificar se tem token válido
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acesso necessário',
        ownerRequired: true 
      });
    }

    const token = authHeader.substring(7);
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Token inválido ou expirado',
        ownerRequired: true 
      });
    }

    // Buscar usuário no banco (estrutura simples)
    const userResult = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        ownerRequired: true 
      });
    }

    const user = userResult.rows[0];

    // Por enquanto, admin@pizzaria.com tem acesso de owner
    const isOwner = user.email === 'admin@pizzaria.com';
    
    if (!isOwner) {
      return res.status(403).json({ 
        error: 'Acesso negado. Área restrita ao proprietário.',
        ownerRequired: true,
        userLevel: 'employee'
      });
    }

    // Adicionar informações do owner ao request
    req.user = {
      id: user.id,
      email: user.email,
      name: 'Proprietário', // Nome padrão
      owner_access: true
    };
    req.isOwner = true;
    
    console.log(`✅ Acesso de owner autorizado para: ${user.email}`);
    next();

  } catch (error) {
    console.error('Erro no middleware de owner:', error);
    res.status(500).json({ 
      error: 'Erro interno de autenticação',
      ownerRequired: true 
    });
  }
};

// Middleware alternativo para verificar se é owner sem bloquear
const checkOwnerStatus = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.isOwner = false;
      return next();
    }

    const token = authHeader.substring(7);
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      req.isOwner = false;
      return next();
    }

    const userResult = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      req.isOwner = false;
      return next();
    }

    const user = userResult.rows[0];
    const isOwner = user.email === 'admin@pizzaria.com';
    
    req.user = {
      id: user.id,
      email: user.email,
      name: 'Proprietário',
      owner_access: isOwner
    };
    req.isOwner = isOwner;
    
    next();

  } catch (error) {
    console.error('Erro ao verificar status de owner:', error);
    req.isOwner = false;
    next();
  }
};

module.exports = {
  authenticateOwner,
  checkOwnerStatus
};