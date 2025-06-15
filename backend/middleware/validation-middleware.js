// Middleware de validação seguindo padrão 80/20 (prevenção/instrução)

const { body, validationResult } = require('express-validator');

// ==================  BINÁRIOS  ===================
const TIPO_PEDIDO = {
  MESA: 0,
  DELIVERY: 1
};

const STATUS_FINANCEIRO = {
  NAO_ENTREGUE: 0,
  ENTREGUE: 1
};

// =============  PREVENÇÃO (80%)  =================

// Validação de payload para pedidos
const validateOrderPayload = [
  body('tipo_pedido').isIn([0, 1]).withMessage('Tipo deve ser 0 (mesa) ou 1 (delivery)'),
  body('numero_mesa').if(body('tipo_pedido').equals('0')).notEmpty().isInt({ min: 1 }),
  body('endereco_entrega').if(body('tipo_pedido').equals('1')).notEmpty(),
  body('cliente_id').optional().isUUID(),
  body('itens').isArray({ min: 1 }).withMessage('Pedido deve ter pelo menos 1 item'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log estruturado
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'validation_failed',
        endpoint: req.originalUrl,
        errors: errors.array(),
        tipo_bin: req.body.tipo_pedido,
        ip: req.ip
      }));
      
      return res.status(400).json({ 
        error: 'Payload inválido',
        details: errors.array() 
      });
    }
    next();
  }
];

// Validação de status
const validateStatusUpdate = [
  body('status_pedido').notEmpty().withMessage('Status é obrigatório'),
  body('forma_pagamento').optional().isString(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'status_validation_failed',
        orderId: req.params.id,
        errors: errors.array()
      }));
      
      return res.status(400).json({ 
        error: 'Dados de status inválidos',
        details: errors.array() 
      });
    }
    next();
  }
];

// Middleware de transação atômica
const withTransaction = (fn) => async (req, res, next) => {
  const client = await req.db.connect();
  
  try {
    await client.query('BEGIN');
    req.dbClient = client;
    
    await fn(req, res, next);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'transaction_rollback',
      error: error.message,
      endpoint: req.originalUrl
    }));
    throw error;
  } finally {
    client.release();
  }
};

// Retry com exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          action: 'retry_attempt',
          attempt: i + 1,
          delay_ms: delay,
          error: error.code
        }));
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
};

// Validação de rotas corretas
const validateRoute = (expectedRoute) => (req, res, next) => {
  const actualRoute = req.originalUrl.split('?')[0];
  
  if (!actualRoute.includes(expectedRoute)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'route_mismatch',
      expected: expectedRoute,
      actual: actualRoute,
      ip: req.ip
    }));
    
    return res.status(404).json({ 
      error: `Rota não encontrada. Use ${expectedRoute} ao invés de ${actualRoute}` 
    });
  }
  
  next();
};

// =============  INSTRUÇÃO (20%)  =================

/**
 * USO MANUAL:
 * 
 * 1. Para validar pedidos:
 *    router.post('/orders', validateOrderPayload, orderController.create);
 * 
 * 2. Para transações atômicas:
 *    router.post('/orders/:id/close', withTransaction(orderController.close));
 * 
 * 3. Para retry automático:
 *    const result = await retryWithBackoff(() => apiClient.post('/external', data));
 * 
 * 4. Para validar rotas:
 *    router.use('/customers', validateRoute('/customers'), customerRoutes);
 * 
 * COMANDOS DEVOPS:
 * - Update: docker compose pull && docker compose up -d
 * - Logs: docker logs backend -f | grep -E '"action":'
 * - Métricas: curl localhost:3001/metrics | grep validation
 */

// Função helper para sincronização
const syncCaixaEDashboard = async (orderId) => {
  const events = ['cashUpdated', 'dashboardRefresh'];
  
  events.forEach(event => {
    process.emit(event, { orderId, timestamp: Date.now() });
  });
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action: 'sync_triggered',
    orderId,
    events
  }));
};

module.exports = {
  // Binários
  TIPO_PEDIDO,
  STATUS_FINANCEIRO,
  
  // Validações
  validateOrderPayload,
  validateStatusUpdate,
  validateRoute,
  
  // Utilitários
  withTransaction,
  retryWithBackoff,
  syncCaixaEDashboard
};