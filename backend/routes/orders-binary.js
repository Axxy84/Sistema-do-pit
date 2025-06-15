// Rotas de pedidos com lógica binária - Padrão 80/20

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// ===== BINÁRIOS (constantes únicas) =====
const TIPO_BIN = {
  MESA: 0,
  DELIVERY: 1
};

const STATUS_BIN = {
  NAO_ENTREGUE: 0,
  ENTREGUE: 1
};

// Mapeamento de status para binário
const STATUS_MAP = {
  'pendente': STATUS_BIN.NAO_ENTREGUE,
  'preparando': STATUS_BIN.NAO_ENTREGUE,
  'pronto': STATUS_BIN.NAO_ENTREGUE,
  'saiu_para_entrega': STATUS_BIN.NAO_ENTREGUE,
  'retirado': STATUS_BIN.NAO_ENTREGUE,
  'entregue': STATUS_BIN.ENTREGUE,
  'fechada': STATUS_BIN.ENTREGUE,
  'cancelado': STATUS_BIN.NAO_ENTREGUE
};

// ===== PREVENÇÃO · 80% =====

// Atualizar status com transação atômica
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status_pedido } = req.body;
  
  // Cliente da transação
  const client = await db.connect();
  
  try {
    // 2️⃣ Backend: transação atômica
    await client.query('BEGIN');
    
    // Buscar pedido atual e verificar
    const orderResult = await client.query(`
      SELECT 
        p.*,
        CASE 
          WHEN p.tipo_pedido = 'mesa' THEN ${TIPO_BIN.MESA}
          ELSE ${TIPO_BIN.DELIVERY}
        END as tipo_bin,
        ${STATUS_MAP[status_pedido] || STATUS_BIN.NAO_ENTREGUE} as novo_status_bin
      FROM pedidos p
      WHERE p.id = $1
      FOR UPDATE
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const order = orderResult.rows[0];
    const statusBinAtual = STATUS_MAP[order.status_pedido];
    const novoStatusBin = STATUS_MAP[status_pedido];
    
    // Validar transição
    if (statusBinAtual === STATUS_BIN.ENTREGUE) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Pedido já foi entregue/fechado' });
    }
    
    // Atualizar status
    const updateResult = await client.query(`
      UPDATE pedidos 
      SET 
        status_pedido = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING total, tipo_pedido
    `, [status_pedido, id]);
    
    // Se marcando como entregue/fechada, registrar no caixa
    if (novoStatusBin === STATUS_BIN.ENTREGUE) {
      await client.query(`
        INSERT INTO transacoes (
          pedido_id, 
          tipo_transacao, 
          forma_pagamento,
          valor, 
          descricao,
          data_transacao
        ) VALUES (
          $1, 
          'entrada', 
          COALESCE(
            (SELECT forma_pagamento FROM pedidos WHERE id = $1),
            'dinheiro'
          ),
          $2, 
          $3,
          NOW()
        )
      `, [
        id,
        updateResult.rows[0].total,
        `Pedido ${order.tipo_bin === TIPO_BIN.MESA ? 'Mesa' : 'Delivery'} finalizado`
      ]);
      
      // 4️⃣ Log estruturado
      console.log(JSON.stringify({
        pedido: id,
        tipo: order.tipo_bin,
        status: novoStatusBin,
        evento: 'update+caixa',
        valor: updateResult.rows[0].total,
        timestamp: new Date().toISOString()
      }));
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      status: status_pedido,
      statusBin: novoStatusBin
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[orders-binary] Erro:', error);
    
    // 3️⃣ Retry é tratado pelo frontend
    res.status(500).json({ 
      error: 'Erro ao atualizar status',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Endpoint para verificar sincronização
router.get('/:id/sync-status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        p.id,
        p.status_pedido,
        p.total,
        p.tipo_pedido,
        CASE 
          WHEN p.tipo_pedido = 'mesa' THEN ${TIPO_BIN.MESA}
          ELSE ${TIPO_BIN.DELIVERY}
        END as tipo_bin,
        CASE 
          WHEN p.status_pedido IN ('entregue', 'fechada') THEN ${STATUS_BIN.ENTREGUE}
          ELSE ${STATUS_BIN.NAO_ENTREGUE}
        END as status_bin,
        EXISTS (
          SELECT 1 FROM transacoes t 
          WHERE t.pedido_id = p.id 
          AND t.tipo_transacao = 'entrada'
        ) as no_caixa
      FROM pedidos p
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('[sync-status] Erro:', error);
    res.status(500).json({ error: 'Erro ao verificar sincronização' });
  }
});

// ===== INSTRUÇÃO · 20% =====

/**
 * Após PATCH/POST bem-sucedido chame syncCaixaEDashboard()
 * 
 * Exemplo de uso:
 * ```javascript
 * // Frontend
 * await apiClient.patch(`/orders/${orderId}/status`, { 
 *   status_pedido: 'entregue' 
 * });
 * await syncCaixaEDashboard();
 * 
 * // Verificar sincronização
 * const sync = await apiClient.get(`/orders/${orderId}/sync-status`);
 * console.log('No caixa?', sync.no_caixa);
 * ```
 * 
 * Para alterar rota, edite ROUTE_CLIENTES em clientService.
 * Atualização via CLI: docker compose pull && docker compose up -d
 */

module.exports = router;