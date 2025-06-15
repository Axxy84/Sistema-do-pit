// Rotas de pedidos v2 - implementando padrão 80/20 prevenção/instrução

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  TIPO_PEDIDO,
  STATUS_FINANCEIRO,
  validateOrderPayload,
  validateStatusUpdate,
  withTransaction,
  retryWithBackoff,
  syncCaixaEDashboard
} = require('../middleware/validation-middleware');

// =============  PREVENÇÃO (80%)  =================

// Criar pedido com validação completa
router.post('/', authenticateToken, validateOrderPayload, withTransaction(async (req, res) => {
  const { dbClient } = req;
  const { tipo_pedido, numero_mesa, endereco_entrega, cliente_id, itens } = req.body;
  
  try {
    // Log estruturado de entrada
    console.log(JSON.stringify({
      action: 'create_order',
      tipo_bin: tipo_pedido,
      mesa_id: numero_mesa,
      itens_count: itens.length,
      user_id: req.user.id
    }));
    
    // Validações condicionais baseadas em binários
    if (tipo_pedido === TIPO_PEDIDO.MESA && !numero_mesa) {
      return res.status(400).json({ error: 'Número da mesa obrigatório para pedidos de mesa' });
    }
    
    if (tipo_pedido === TIPO_PEDIDO.DELIVERY && !endereco_entrega) {
      return res.status(400).json({ error: 'Endereço obrigatório para delivery' });
    }
    
    // Criar pedido
    const orderResult = await dbClient.query(`
      INSERT INTO pedidos (
        tipo_pedido, numero_mesa, endereco_entrega, 
        cliente_id, usuario_id, status_pedido, total
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      tipo_pedido,
      tipo_pedido === TIPO_PEDIDO.MESA ? numero_mesa : null,
      tipo_pedido === TIPO_PEDIDO.DELIVERY ? endereco_entrega : null,
      cliente_id,
      req.user.id,
      'pendente',
      0
    ]);
    
    const order = orderResult.rows[0];
    
    // Inserir itens
    let total = 0;
    for (const item of itens) {
      await dbClient.query(`
        INSERT INTO itens_pedido (
          pedido_id, produto_id, quantidade, 
          preco_unitario, subtotal, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        order.id,
        item.produto_id,
        item.quantidade,
        item.preco_unitario,
        item.quantidade * item.preco_unitario,
        item.observacoes
      ]);
      
      total += item.quantidade * item.preco_unitario;
    }
    
    // Atualizar total
    await dbClient.query(
      'UPDATE pedidos SET total = $1 WHERE id = $2',
      [total, order.id]
    );
    
    // Sincronizar caixa e dashboard
    await syncCaixaEDashboard(order.id);
    
    res.status(201).json({ 
      success: true, 
      order: { ...order, total } 
    });
    
  } catch (error) {
    console.error(JSON.stringify({
      action: 'create_order_error',
      error: error.message,
      stack: error.stack
    }));
    
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
}));

// Atualizar status com validação
router.patch('/:id/status', authenticateToken, validateStatusUpdate, async (req, res) => {
  const { id } = req.params;
  const { status_pedido, forma_pagamento } = req.body;
  
  try {
    // Buscar pedido atual
    const currentOrder = await req.db.query(
      'SELECT tipo_pedido, status_pedido FROM pedidos WHERE id = $1',
      [id]
    );
    
    if (currentOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const order = currentOrder.rows[0];
    
    // Validar transição de status
    const validTransitions = {
      'pendente': ['preparando', 'cancelado'],
      'preparando': ['pronto', 'cancelado'],
      'pronto': order.tipo_pedido === TIPO_PEDIDO.MESA ? ['retirado'] : ['saiu_para_entrega'],
      'retirado': ['fechada'],
      'saiu_para_entrega': ['entregue'],
      'entregue': [],
      'fechada': [],
      'cancelado': []
    };
    
    if (!validTransitions[order.status_pedido]?.includes(status_pedido)) {
      return res.status(400).json({ 
        error: `Transição inválida de ${order.status_pedido} para ${status_pedido}` 
      });
    }
    
    // Atualizar com retry
    await retryWithBackoff(async () => {
      await req.db.query(
        'UPDATE pedidos SET status_pedido = $1, updated_at = NOW() WHERE id = $2',
        [status_pedido, id]
      );
    });
    
    // Se fechando conta, registrar pagamento
    if (status_pedido === 'fechada' && forma_pagamento) {
      await req.db.query(`
        INSERT INTO transacoes (
          pedido_id, tipo_transacao, forma_pagamento, 
          valor, descricao
        ) VALUES ($1, 'entrada', $2, 
          (SELECT total FROM pedidos WHERE id = $1), 
          'Pagamento do pedido')
      `, [id, forma_pagamento]);
    }
    
    // Log estruturado
    console.log(JSON.stringify({
      action: 'status_updated',
      order_id: id,
      old_status: order.status_pedido,
      new_status: status_pedido,
      tipo_bin: order.tipo_pedido,
      status_bin: status_pedido === 'entregue' || status_pedido === 'fechada' ? 
        STATUS_FINANCEIRO.ENTREGUE : STATUS_FINANCEIRO.NAO_ENTREGUE
    }));
    
    // Sincronizar
    await syncCaixaEDashboard(id);
    
    res.json({ success: true, status: status_pedido });
    
  } catch (error) {
    console.error(JSON.stringify({
      action: 'status_update_error',
      order_id: id,
      error: error.message
    }));
    
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// =============  INSTRUÇÃO (20%)  =================

/**
 * ENDPOINTS DISPONÍVEIS:
 * 
 * POST /orders
 * - Cria novo pedido com validação automática
 * - tipo_pedido: 0 (mesa) ou 1 (delivery)
 * 
 * PATCH /orders/:id/status
 * - Atualiza status com validação de transições
 * - Sincroniza caixa e dashboard automaticamente
 * 
 * EXEMPLO DE USO:
 * ```javascript
 * // Criar pedido de mesa
 * const pedidoMesa = {
 *   tipo_pedido: 0,
 *   numero_mesa: 5,
 *   itens: [{ produto_id: 'uuid', quantidade: 2, preco_unitario: 35.90 }]
 * };
 * 
 * // Criar pedido delivery
 * const pedidoDelivery = {
 *   tipo_pedido: 1,
 *   endereco_entrega: 'Rua A, 123',
 *   cliente_id: 'uuid',
 *   itens: [...]
 * };
 * ```
 */

module.exports = router;