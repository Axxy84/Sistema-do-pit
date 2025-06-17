const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizzaria_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '8477'
});

/**
 * Sistema de autenticação JWT específico para cada aplicação
 * Suporta diferentes tipos de usuários e níveis de acesso
 */

// Configurações de JWT por tipo de app
const JWT_CONFIG = {
  waiter: {
    secret: process.env.JWT_SECRET || 'pizzaria-secret-key',
    expiresIn: '12h', // Turno de trabalho
    allowedRoles: ['garcom', 'admin']
  },
  deliverer: {
    secret: process.env.JWT_SECRET || 'pizzaria-secret-key', 
    expiresIn: '24h', // Dia de trabalho
    allowedRoles: ['entregador', 'admin']
  },
  owner: {
    secret: process.env.JWT_SECRET || 'pizzaria-secret-key',
    expiresIn: '7d', // Acesso prolongado
    allowedRoles: ['admin', 'dono']
  },
  system: {
    secret: process.env.JWT_SECRET || 'pizzaria-secret-key',
    expiresIn: '1h', // Sistema principal
    allowedRoles: ['admin', 'atendente', 'garcom', 'entregador']
  }
};

/**
 * Gerar token JWT específico para cada tipo de app
 * @param {string} userId - ID do usuário
 * @param {string} appType - Tipo do app (waiter, deliverer, owner, system)
 * @param {object} additionalData - Dados adicionais para o token
 * @returns {string} Token JWT
 */
const generateAppToken = (userId, appType, additionalData = {}) => {
  const config = JWT_CONFIG[appType];
  if (!config) {
    throw new Error(`Tipo de app inválido: ${appType}`);
  }

  const payload = {
    userId,
    appType,
    iat: Math.floor(Date.now() / 1000),
    ...additionalData
  };

  return jwt.sign(payload, config.secret, { 
    expiresIn: config.expiresIn,
    issuer: 'pizzaria-system',
    audience: appType
  });
};

/**
 * Middleware de autenticação para App do Garçom
 */
const authenticateWaiter = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_CONFIG.waiter.secret, {
      audience: 'waiter'
    });

    // Verificar se é token do app correto
    if (decoded.appType !== 'waiter' && decoded.appType !== 'system') {
      return res.status(403).json({ 
        error: 'Token inválido para este app',
        code: 'INVALID_APP_TOKEN'
      });
    }

    // Buscar usuário na base
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1 AND tipo_usuario = ANY($2)',
      [decoded.userId, JWT_CONFIG.waiter.allowedRoles]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Usuário não autorizado para app do garçom',
        code: 'USER_NOT_AUTHORIZED'
      });
    }

    const user = userResult.rows[0];

    // Verificar se usuário está ativo
    if (!user.ativo) {
      return res.status(403).json({ 
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    // Adicionar informações do usuário à requisição
    req.user = user;
    req.auth = {
      appType: 'waiter',
      tokenType: decoded.appType,
      permissions: getWaiterPermissions(user.tipo_usuario)
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Erro na autenticação do garçom:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware de autenticação para App do Entregador
 */
const authenticateDeliverer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, JWT_CONFIG.deliverer.secret, {
      audience: 'deliverer'
    });

    if (decoded.appType !== 'deliverer' && decoded.appType !== 'system') {
      return res.status(403).json({ 
        error: 'Token inválido para este app',
        code: 'INVALID_APP_TOKEN'
      });
    }

    // Verificar primeiro na tabela usuários
    let userResult = await pool.query(
      'SELECT *, \'usuario\' as user_type FROM usuarios WHERE id = $1 AND tipo_usuario = ANY($2)',
      [decoded.userId, JWT_CONFIG.deliverer.allowedRoles]
    );

    // Se não encontrou, verificar na tabela entregadores
    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        'SELECT *, \'entregador\' as user_type FROM entregadores WHERE id = $1 AND ativo = true',
        [decoded.userId]
      );
    }

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Entregador não autorizado',
        code: 'DELIVERER_NOT_AUTHORIZED'
      });
    }

    const user = userResult.rows[0];

    // Verificar se está ativo
    if (!user.ativo) {
      return res.status(403).json({ 
        error: 'Entregador inativo',
        code: 'DELIVERER_INACTIVE'
      });
    }

    req.user = user;
    req.auth = {
      appType: 'deliverer',
      tokenType: decoded.appType,
      permissions: getDelivererPermissions(user.user_type)
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Erro na autenticação do entregador:', error);
    res.status(401).json({ 
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware de autenticação para App do Dono
 */
const authenticateOwner = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, JWT_CONFIG.owner.secret, {
      audience: 'owner'
    });

    if (decoded.appType !== 'owner' && decoded.appType !== 'system') {
      return res.status(403).json({ 
        error: 'Token inválido para este app',
        code: 'INVALID_APP_TOKEN'
      });
    }

    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1 AND tipo_usuario = ANY($2)',
      [decoded.userId, JWT_CONFIG.owner.allowedRoles]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Acesso negado - apenas proprietários',
        code: 'OWNER_ACCESS_ONLY'
      });
    }

    const user = userResult.rows[0];

    if (!user.ativo) {
      return res.status(403).json({ 
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    req.user = user;
    req.auth = {
      appType: 'owner',
      tokenType: decoded.appType,
      permissions: getOwnerPermissions(user.tipo_usuario)
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Erro na autenticação do proprietário:', error);
    res.status(401).json({ 
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware de autenticação universal (sistema principal)
 */
const authenticateSystem = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, JWT_CONFIG.system.secret);

    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    if (!user.ativo) {
      return res.status(403).json({ 
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    req.user = user;
    req.auth = {
      appType: 'system',
      tokenType: decoded.appType || 'system',
      permissions: getSystemPermissions(user.tipo_usuario)
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Erro na autenticação do sistema:', error);
    res.status(401).json({ 
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware para verificar permissões específicas
 * @param {Array} requiredPermissions - Lista de permissões necessárias
 * @returns {Function} Middleware
 */
const requirePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.auth || !req.auth.permissions) {
      return res.status(403).json({ 
        error: 'Informações de autorização não encontradas',
        code: 'NO_AUTH_INFO'
      });
    }

    const userPermissions = req.auth.permissions;
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Permissão insuficiente',
        code: 'INSUFFICIENT_PERMISSION',
        required: requiredPermissions,
        user_permissions: userPermissions
      });
    }

    next();
  };
};

/**
 * Funções para definir permissões por tipo de usuário
 */
function getWaiterPermissions(userType) {
  const permissions = ['view_tables', 'create_orders', 'update_order_status'];
  
  if (userType === 'admin') {
    permissions.push('manage_tables', 'view_all_orders', 'close_tables');
  }
  
  return permissions;
}

function getDelivererPermissions(userType) {
  const permissions = ['view_deliveries', 'accept_delivery', 'update_delivery_status', 'complete_delivery'];
  
  if (userType === 'admin') {
    permissions.push('view_all_deliveries', 'assign_deliveries');
  }
  
  return permissions;
}

function getOwnerPermissions(userType) {
  return [
    'view_analytics',
    'view_financial_reports', 
    'view_customer_analytics',
    'view_operational_analytics',
    'manage_alerts',
    'view_all_data'
  ];
}

function getSystemPermissions(userType) {
  const basePermissions = ['view_orders', 'create_orders'];
  
  switch (userType) {
    case 'admin':
      return [
        ...basePermissions,
        'manage_products',
        'manage_users',
        'manage_customers',
        'view_reports',
        'manage_cash_closing',
        'view_dashboard'
      ];
    case 'atendente':
      return [
        ...basePermissions,
        'manage_customers',
        'view_basic_reports'
      ];
    case 'garcom':
      return [
        ...basePermissions,
        'manage_tables',
        'update_order_status'
      ];
    case 'entregador':
      return [
        'view_deliveries',
        'update_delivery_status'
      ];
    default:
      return basePermissions;
  }
}

/**
 * Endpoint para login específico por app
 */
const createAppLoginEndpoint = (appType) => {
  return async (req, res) => {
    try {
      const { email, senha, telefone } = req.body;
      
      let userQuery = '';
      let params = [];
      
      if (appType === 'deliverer' && telefone) {
        // Login por telefone para entregadores
        userQuery = 'SELECT * FROM entregadores WHERE telefone = $1 AND ativo = true';
        params = [telefone];
      } else if (email) {
        // Login por email para outros apps
        userQuery = 'SELECT * FROM usuarios WHERE email = $1 AND ativo = true';
        params = [email];
      } else {
        return res.status(400).json({ 
          error: 'Email ou telefone é obrigatório',
          code: 'MISSING_CREDENTIALS'
        });
      }

      const userResult = await pool.query(userQuery, params);

      if (userResult.rows.length === 0) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const user = userResult.rows[0];

      // Verificar senha (implementar hash comparison)
      // Por ora, comparação simples
      if (user.senha !== senha && user.senha_hash !== senha) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verificar se usuário tem acesso ao app
      const allowedRoles = JWT_CONFIG[appType]?.allowedRoles || [];
      const userRole = user.tipo_usuario || 'entregador';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: `Usuário não autorizado para o app ${appType}`,
          code: 'APP_ACCESS_DENIED'
        });
      }

      // Gerar token específico do app
      const token = generateAppToken(user.id, appType, {
        nome: user.nome,
        role: userRole
      });

      // Atualizar último login
      if (appType === 'deliverer' && telefone) {
        await pool.query(
          'UPDATE entregadores SET ultimo_login = NOW() WHERE id = $1',
          [user.id]
        );
      } else {
        await pool.query(
          'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
          [user.id]
        );
      }

      res.json({
        success: true,
        message: `Login realizado no app ${appType}`,
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          tipo: userRole
        },
        app: appType,
        permissions: getAppPermissions(appType, userRole)
      });

    } catch (error) {
      console.error(`Erro no login do app ${appType}:`, error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

function getAppPermissions(appType, userRole) {
  switch (appType) {
    case 'waiter':
      return getWaiterPermissions(userRole);
    case 'deliverer':
      return getDelivererPermissions(userRole);
    case 'owner':
      return getOwnerPermissions(userRole);
    default:
      return getSystemPermissions(userRole);
  }
}

module.exports = {
  generateAppToken,
  authenticateWaiter,
  authenticateDeliverer, 
  authenticateOwner,
  authenticateSystem,
  requirePermissions,
  createAppLoginEndpoint,
  JWT_CONFIG
};