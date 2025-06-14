const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const cache = require('../cache/cache-manager');
const { CacheKeys, getPeriodKey } = require('../cache/cache-keys');

const router = express.Router();

// GET /api/orders - Listar todos os pedidos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, data_inicio, data_fim, cliente_id } = req.query;
    const cacheKey = CacheKeys.ORDERS_LIST(status, data_inicio, data_fim, cliente_id);
    
    // Implementação Cache-Aside para listagem de pedidos
    const orders = await cache.getOrFetch(cacheKey, async () => {
      let query = `
        SELECT 
          p.*,
          c.nome as cliente_nome,
          c.telefone as cliente_telefone,
          c.endereco as cliente_endereco,
          cp.codigo as cupom_codigo,
          cp.tipo_desconto as cupom_tipo,
          cp.valor_desconto as cupom_valor,
          p.tipo_pedido,
          p.numero_mesa,
          p.endereco_entrega,
          p.taxa_entrega,
          p.entregador_nome,
          p.multiplos_pagamentos
        FROM pedidos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN cupons cp ON p.cupom_id = cp.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      if (status) {
        // Suportar array de status para filtrar múltiplos valores
        if (Array.isArray(status)) {
          const statusPlaceholders = status.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND LOWER(p.status_pedido) IN (${statusPlaceholders.toLowerCase()})`;
          params.push(...status.map(s => s.toLowerCase()));
          paramIndex += status.length;
        } else {
          query += ` AND LOWER(p.status_pedido) = LOWER($${paramIndex++})`;
          params.push(status);
        }
      }

      if (data_inicio) {
        query += ` AND DATE(COALESCE(p.data_pedido, p.created_at)) >= DATE($${paramIndex++})`;
        params.push(data_inicio);
      }

      if (data_fim) {
        query += ` AND DATE(COALESCE(p.data_pedido, p.created_at)) <= DATE($${paramIndex++})`;
        params.push(data_fim);
      }

      if (cliente_id) {
        query += ` AND p.cliente_id = $${paramIndex++}`;
        params.push(cliente_id);
      }

      query += ' ORDER BY p.data_pedido DESC, p.created_at DESC';

      const ordersResult = await db.query(query, params);
      
      // Buscar itens e pagamentos de cada pedido
      const ordersWithItems = await Promise.all(
        ordersResult.rows.map(async (order) => {
          // Buscar itens do pedido
          const itemsResult = await db.query(`
            SELECT 
              ip.*,
              pr.nome as produto_nome,
              pr.tipo_produto,
              pr.categoria
            FROM itens_pedido ip
            LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
            WHERE ip.pedido_id = $1
            ORDER BY ip.created_at
          `, [order.id]);

          // Buscar múltiplos pagamentos se habilitado
          let pagamentos = [];
          if (order.multiplos_pagamentos) {
            const pagamentosResult = await db.query(`
              SELECT * FROM pagamentos_pedido 
              WHERE pedido_id = $1 
              ORDER BY created_at
            `, [order.id]);
            pagamentos = pagamentosResult.rows;
          }

          return {
            ...order,
            itens_pedido: itemsResult.rows,
            pagamentos: pagamentos,
            cliente_id: order.cliente_id ? {
              id: order.cliente_id,
              nome: order.cliente_nome,
              telefone: order.cliente_telefone,
              endereco: order.cliente_endereco
            } : null,
            entregador_nome: order.entregador_nome,
            cupom_id_data: order.cupom_id ? {
              id: order.cupom_id,
              codigo: order.cupom_codigo,
              tipo_desconto: order.cupom_tipo,
              valor_desconto: order.cupom_valor
            } : null
          };
        })
      );

      return ordersWithItems;
    }, 
    // TTL baseado no filtro - dados mais específicos cache por mais tempo
    status === 'entregue' || status === 'cancelado' ? 900 : 180 // 15 min para finalizados, 3 min para outros
    );

    res.json({ orders });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/orders/:id - Buscar pedido por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CacheKeys.ORDERS_BY_ID(id);
    
    // Implementação Cache-Aside para pedido específico
    const orderWithItems = await cache.getOrFetch(cacheKey, async () => {
      const orderResult = await db.query(`
        SELECT 
          p.*,
          c.nome as cliente_nome,
          c.telefone as cliente_telefone,
          c.endereco as cliente_endereco,
          cp.codigo as cupom_codigo,
          cp.tipo_desconto as cupom_tipo,
          cp.valor_desconto as cupom_valor,
          p.tipo_pedido,
          p.numero_mesa,
          p.endereco_entrega,
          p.taxa_entrega,
          p.entregador_nome,
          p.multiplos_pagamentos
        FROM pedidos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN cupons cp ON p.cupom_id = cp.id
        WHERE p.id = $1
      `, [id]);
      
      if (orderResult.rows.length === 0) {
        throw new Error('Pedido não encontrado');
      }

      const order = orderResult.rows[0];

      // Buscar itens do pedido
      const itemsResult = await db.query(`
        SELECT 
          ip.*,
          pr.nome as produto_nome,
          pr.tipo_produto,
          pr.categoria
        FROM itens_pedido ip
        LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
        WHERE ip.pedido_id = $1
        ORDER BY ip.created_at
      `, [id]);

      // Buscar múltiplos pagamentos se habilitado
      let pagamentos = [];
      if (order.multiplos_pagamentos) {
        const pagamentosResult = await db.query(`
          SELECT * FROM pagamentos_pedido 
          WHERE pedido_id = $1 
          ORDER BY created_at
        `, [id]);
        pagamentos = pagamentosResult.rows;
      }

      return {
        ...order,
        itens_pedido: itemsResult.rows,
        pagamentos: pagamentos,
        cliente_id: order.cliente_id ? {
          id: order.cliente_id,
          nome: order.cliente_nome,
          telefone: order.cliente_telefone,
          endereco: order.cliente_endereco
        } : null,
        entregador_nome: order.entregador_nome,
        cupom_id_data: order.cupom_id ? {
          id: order.cupom_id,
          codigo: order.cupom_codigo,
          tipo_desconto: order.cupom_tipo,
          valor_desconto: order.cupom_valor
        } : null
      };
    }, 
    // TTL baseado no status do pedido
    getOrderCacheTTL(orderWithItems?.status_pedido)
    );
    
    res.json({ order: orderWithItems });
  } catch (error) {
    if (error.message === 'Pedido não encontrado') {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

/**
 * Determina o TTL do cache baseado no status do pedido
 * Pedidos finalizados podem ter cache mais longo
 */
function getOrderCacheTTL(status) {
  if (!status) return 300; // padrão 5 minutos
  
  switch(status.toLowerCase()) {
    case 'entregue':
    case 'retirado':
    case 'cancelado':
      return 1800; // 30 minutos - dados não mudam mais
    case 'preparando':
    case 'pronto':
      return 120; // 2 minutos - mudanças frequentes
    default:
      return 300; // 5 minutos - padrão
  }
}

/**
 * Função para invalidar caches de pedidos
 * Chamada quando um pedido é criado, atualizado ou deletado
 */
function invalidateOrderCaches(orderId, clienteId) {
  // Invalidar cache do pedido específico
  if (orderId) {
    cache.delete(CacheKeys.ORDERS_BY_ID(orderId));
  }
  
  // Invalidar todas as listagens de pedidos (diferentes filtros)
  cache.deletePattern(CacheKeys.PATTERNS.ORDERS);
  
  // Invalidar caches relacionados (dashboard, relatórios)
  cache.deletePattern(CacheKeys.PATTERNS.DASHBOARD);
  cache.deletePattern(CacheKeys.PATTERNS.REPORTS);
  
  console.log(`🧹 Invalidated order caches for order: ${orderId}, client: ${clienteId}`);
}

// POST /api/orders - Criar novo pedido
router.post('/', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { 
      cliente_id,
      entregador_nome,
      total,
      forma_pagamento,
      valor_pago,
      troco_calculado,
      cupom_id,
      desconto_aplicado = 0,
      pontos_ganhos = 0,
      pontos_resgatados = 0,
      observacoes,
      items = [],
      tipo_pedido = 'delivery',
      numero_mesa,
      endereco_entrega,
      taxa_entrega = 0,
      // Novos campos para múltiplos pagamentos
      multiplos_pagamentos = false,
      pagamentos = []
    } = req.body;
    
    // Debug log para entender o payload recebido
    console.log('[POST /api/orders] Payload recebido:', {
      tipo_pedido,
      endereco_entrega,
      numero_mesa,
      cliente_id,
      items: items.length,
      total
    });

    // Validações básicas
    if (!total || items.length === 0) {
      throw new Error('Total e itens são obrigatórios');
    }

    // Validações específicas por tipo de pedido
    if (tipo_pedido === 'delivery' && !endereco_entrega) {
      console.error('[POST /api/orders] Erro: Endereço de entrega faltando para delivery', {
        tipo_pedido,
        endereco_entrega,
        req_body_keys: Object.keys(req.body)
      });
      throw new Error('Endereço de entrega é obrigatório para pedidos de delivery');
    }

    if (tipo_pedido === 'mesa' && !numero_mesa) {
      throw new Error('Número da mesa é obrigatório para pedidos de mesa');
    }

    if (!['delivery', 'mesa'].includes(tipo_pedido)) {
      throw new Error('Tipo de pedido deve ser "delivery" ou "mesa"');
    }

    // Validar múltiplos pagamentos se habilitado
    if (multiplos_pagamentos && pagamentos.length > 0) {
      const totalPagamentos = pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
      if (Math.abs(totalPagamentos - parseFloat(total)) > 0.01) {
        throw new Error('A soma dos pagamentos deve ser igual ao total do pedido');
      }
    }

    // Criar o pedido
    const orderResult = await client.query(`
      INSERT INTO pedidos (
        cliente_id, entregador_nome, total, forma_pagamento, valor_pago,
        troco_calculado, cupom_id, desconto_aplicado, pontos_ganhos,
        pontos_resgatados, observacoes, status_pedido, tipo_pedido,
        numero_mesa, endereco_entrega, taxa_entrega, multiplos_pagamentos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      cliente_id, 
      entregador_nome,
      parseFloat(total), 
      forma_pagamento,
      valor_pago ? parseFloat(valor_pago) : null,
      troco_calculado ? parseFloat(troco_calculado) : null,
      cupom_id, 
      parseFloat(desconto_aplicado),
      parseInt(pontos_ganhos), 
      parseInt(pontos_resgatados),
      observacoes, 
      'pendente',
      tipo_pedido,
      tipo_pedido === 'mesa' ? parseInt(numero_mesa) : null,
      tipo_pedido === 'delivery' ? endereco_entrega : null,
      parseFloat(taxa_entrega),
      multiplos_pagamentos
    ]);

    const savedOrder = orderResult.rows[0];

    // Salvar múltiplos pagamentos se habilitado
    if (multiplos_pagamentos && pagamentos.length > 0) {
      for (const pagamento of pagamentos) {
        if (parseFloat(pagamento.valor || 0) > 0) {
          await client.query(`
            INSERT INTO pagamentos_pedido (
              pedido_id, forma_pagamento, valor, observacoes
            ) VALUES ($1, $2, $3, $4)
          `, [
            savedOrder.id,
            pagamento.forma_pagamento,
            parseFloat(pagamento.valor),
            pagamento.observacoes || null
          ]);
        }
      }
    }

    // Criar itens do pedido com suporte a múltiplos sabores
    for (const item of items) {
      console.log('[POST /api/orders] Processando item:', {
        itemType: item.itemType,
        sabores_registrados: item.sabores_registrados,
        sabor_registrado: item.sabor_registrado,
        tamanho_registrado: item.tamanho_registrado
      });
      
      // Verificar se é uma pizza com múltiplos sabores
      if (item.itemType === 'pizza' && item.sabores_registrados && item.sabores_registrados.length > 1) {
        // Pizza com múltiplos sabores - salvar no campo sabores_registrados
        await client.query(`
          INSERT INTO itens_pedido (
            pedido_id, sabores_registrados, tamanho_registrado, 
            quantidade, valor_unitario
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          savedOrder.id,
          JSON.stringify(item.sabores_registrados),
          item.tamanho_registrado || null,
          parseInt(item.quantidade),
          parseFloat(item.valor_unitario)
        ]);
      } else {
        // Pizza tradicional (1 sabor) ou outros produtos - usar campos antigos
        
        // Validar e limpar produto_id_ref
        let produto_id_ref = item.produto_id_ref;
        
        // Se produto_id_ref não é um UUID válido, definir como null
        if (produto_id_ref) {
          // Converter qualquer coisa que não seja UUID para null
          if (typeof produto_id_ref !== 'string' || 
              produto_id_ref.length !== 36 || 
              !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(produto_id_ref)) {
            console.warn('⚠️ produto_id_ref inválido convertido para NULL:', {
              produto_id_ref: produto_id_ref,
              type: typeof produto_id_ref,
              itemType: item.itemType,
              sabor_registrado: item.sabor_registrado
            });
            produto_id_ref = null;
          }
        }
        
        await client.query(`
          INSERT INTO itens_pedido (
            pedido_id, produto_id_ref, sabor_registrado, 
            tamanho_registrado, quantidade, valor_unitario
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          savedOrder.id,
          produto_id_ref,
          item.sabor_registrado || null,
          item.tamanho_registrado || null,
          parseInt(item.quantidade),
          parseFloat(item.valor_unitario)
        ]);
      }
    }

    // Incrementar uso do cupom se aplicável
    if (cupom_id) {
      await client.query(`
        UPDATE cupons 
        SET usos_atuais = usos_atuais + 1, updated_at = NOW()
        WHERE id = $1
      `, [cupom_id]);
    }

    // Atualizar pontos do cliente se aplicável
    if (cliente_id && (pontos_ganhos > 0 || pontos_resgatados > 0)) {
      // Note: Assumindo que pontos são calculados diretamente dos pedidos
      // Se houver tabela separada de pontos, implementar aqui
    }

    await client.query('COMMIT');
    
    // Invalidar caches relacionados após criar pedido
    invalidateOrderCaches(savedOrder.id, cliente_id);
    
    // Buscar pedido completo para retornar
    const completeOrderResult = await db.query(`
      SELECT 
        p.*,
        c.nome as cliente_nome
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = $1
    `, [savedOrder.id]);

    res.status(201).json({ order: completeOrderResult.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);
    console.error('Stack trace:', error.stack);
    console.error('Payload recebido:', req.body);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id - Atualizar pedido completo
router.patch('/:id', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      cliente_id,
      entregador_nome,
      total,
      forma_pagamento,
      valor_pago,
      troco_calculado,
      cupom_id,
      desconto_aplicado,
      pontos_ganhos,
      pontos_resgatados,
      observacoes,
      status_pedido,
      items = [],
      tipo_pedido,
      numero_mesa,
      endereco_entrega,
      taxa_entrega
    } = req.body;

    // Verificar se pedido existe
    const existingOrder = await client.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (existingOrder.rows.length === 0) {
      throw new Error('Pedido não encontrado');
    }

    // Validações específicas por tipo de pedido
    if (tipo_pedido) {
      if (tipo_pedido === 'delivery' && !endereco_entrega) {
        throw new Error('Endereço de entrega é obrigatório para pedidos de delivery');
      }
      if (tipo_pedido === 'mesa' && !numero_mesa) {
        throw new Error('Número da mesa é obrigatório para pedidos de mesa');
      }
    }

    // Atualizar o pedido
    const updateResult = await client.query(`
      UPDATE pedidos SET
        cliente_id = COALESCE($1, cliente_id),
        entregador_nome = $2,
        total = COALESCE($3, total),
        forma_pagamento = COALESCE($4, forma_pagamento),
        valor_pago = $5,
        troco_calculado = $6,
        cupom_id = $7,
        desconto_aplicado = COALESCE($8, desconto_aplicado),
        pontos_ganhos = COALESCE($9, pontos_ganhos),
        pontos_resgatados = COALESCE($10, pontos_resgatados),
        observacoes = $11,
        status_pedido = COALESCE($12, status_pedido),
        tipo_pedido = COALESCE($13, tipo_pedido),
        numero_mesa = $14,
        endereco_entrega = $15,
        taxa_entrega = COALESCE($16, taxa_entrega),
        updated_at = NOW()
      WHERE id = $17
      RETURNING *
    `, [
      cliente_id,
      entregador_nome,
      total ? parseFloat(total) : null,
      forma_pagamento,
      valor_pago ? parseFloat(valor_pago) : null,
      troco_calculado ? parseFloat(troco_calculado) : null,
      cupom_id,
      desconto_aplicado ? parseFloat(desconto_aplicado) : null,
      pontos_ganhos ? parseInt(pontos_ganhos) : null,
      pontos_resgatados ? parseInt(pontos_resgatados) : null,
      observacoes,
      status_pedido,
      tipo_pedido,
      tipo_pedido === 'mesa' ? parseInt(numero_mesa) : null,
      tipo_pedido === 'delivery' ? endereco_entrega : null,
      taxa_entrega ? parseFloat(taxa_entrega) : null,
      id
    ]);

    // Se há itens para atualizar
    if (items && items.length > 0) {
      // Deletar itens antigos
      await client.query('DELETE FROM itens_pedido WHERE pedido_id = $1', [id]);
      
      // Inserir novos itens com suporte a múltiplos sabores
      for (const item of items) {
        // Verificar se é uma pizza com múltiplos sabores
        if (item.itemType === 'pizza' && item.sabores_registrados && item.sabores_registrados.length > 1) {
          // Pizza com múltiplos sabores - salvar no campo sabores_registrados
          await client.query(`
            INSERT INTO itens_pedido (
              pedido_id, sabores_registrados, tamanho_registrado, 
              quantidade, valor_unitario
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            id,
            JSON.stringify(item.sabores_registrados),
            item.tamanho_registrado || null,
            parseInt(item.quantidade),
            parseFloat(item.valor_unitario)
          ]);
        } else {
          // Pizza tradicional (1 sabor) ou outros produtos - usar campos antigos
          
          // Validar e limpar produto_id_ref
          let produto_id_ref = item.produto_id_ref;
          
          // Se produto_id_ref não é um UUID válido, definir como null
          if (produto_id_ref) {
            // Converter qualquer coisa que não seja UUID para null
            if (typeof produto_id_ref !== 'string' || 
                produto_id_ref.length !== 36 || 
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(produto_id_ref)) {
              console.warn('⚠️ produto_id_ref inválido convertido para NULL:', {
                produto_id_ref: produto_id_ref,
                type: typeof produto_id_ref,
                itemType: item.itemType,
                sabor_registrado: item.sabor_registrado
              });
              produto_id_ref = null;
            }
          }
          
          await client.query(`
            INSERT INTO itens_pedido (
              pedido_id, produto_id_ref, sabor_registrado, 
              tamanho_registrado, quantidade, valor_unitario
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            id,
            produto_id_ref,
            item.sabor_registrado || null,
            item.tamanho_registrado || null,
            parseInt(item.quantidade),
            parseFloat(item.valor_unitario)
          ]);
        }
      }
    }

    await client.query('COMMIT');

    // Invalidar caches relacionados após atualizar pedido
    invalidateOrderCaches(id, cliente_id);

    // Buscar pedido atualizado com joins
    const completeOrderResult = await db.query(`
      SELECT 
        p.*,
        c.nome as cliente_nome
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = $1
    `, [id]);

    res.json({ order: completeOrderResult.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar pedido:', error);
    res.status(error.message === 'Pedido não encontrado' ? 404 : 500).json({ 
      error: error.message || 'Erro interno do servidor'
    });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status - Atualizar status do pedido
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status_pedido } = req.body;
    
    // Debug logs
    console.log('[PATCH /orders/:id/status] Recebido:', { id, status_pedido, body: req.body });

    const validStatuses = ['pendente', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'retirado', 'cancelado'];
    
    console.log('[PATCH /orders/:id/status] Status válidos:', validStatuses);
    console.log('[PATCH /orders/:id/status] Status é válido?', validStatuses.includes(status_pedido));
    
    if (!validStatuses.includes(status_pedido)) {
      console.log('[PATCH /orders/:id/status] Status inválido:', status_pedido);
      return res.status(400).json({ 
        error: 'Status inválido',
        message: `Status deve ser um dos: ${validStatuses.join(', ')}`,
        receivedStatus: status_pedido,
        receivedBody: req.body
      });
    }

    const result = await db.query(`
      UPDATE pedidos 
      SET status_pedido = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status_pedido, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Invalidar caches após atualizar status
    invalidateOrderCaches(id, result.rows[0].cliente_id);

    res.json({ order: result.rows[0] });

  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// DELETE /api/orders/:id - Deletar pedido
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Buscar dados do pedido antes de deletar para invalidação de cache
    const orderResult = await client.query('SELECT cliente_id FROM pedidos WHERE id = $1', [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const clienteId = orderResult.rows[0].cliente_id;

    // Deletar itens do pedido
    await client.query('DELETE FROM itens_pedido WHERE pedido_id = $1', [id]);
    
    // Deletar pagamentos múltiplos se existirem
    await client.query('DELETE FROM pagamentos_pedido WHERE pedido_id = $1', [id]);
    
    // Deletar o pedido
    await client.query('DELETE FROM pedidos WHERE id = $1', [id]);

    await client.query('COMMIT');

    // Invalidar caches após deletar pedido
    invalidateOrderCaches(id, clienteId);

    res.json({ message: 'Pedido deletado com sucesso' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// ==================== ROTAS DE FECHAMENTO INDIVIDUAL DE MESA ====================

// GET /api/orders/mesa/:numero/resumo - Buscar resumo da mesa para fechamento
router.get('/mesa/:numero/resumo', authenticateToken, async (req, res) => {
  try {
    const { numero } = req.params;
    
    // Verificar se existe mesa com esse número que não está fechada
    const mesaResult = await db.query(`
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.numero_mesa = $1 
        AND p.tipo_pedido = 'mesa'
        AND p.status_pedido NOT IN ('entregue', 'fechada', 'cancelado')
      ORDER BY p.created_at DESC
      LIMIT 1
    `, [numero]);

    if (mesaResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Mesa não encontrada ou já fechada' 
      });
    }

    const mesa = mesaResult.rows[0];

    // Buscar todos os itens da mesa
    const itensResult = await db.query(`
      SELECT 
        ip.*,
        pr.nome as produto_nome,
        pr.tipo_produto,
        pr.categoria
      FROM itens_pedido ip
      LEFT JOIN produtos pr ON ip.produto_id_ref = pr.id
      WHERE ip.pedido_id = $1
      ORDER BY ip.created_at
    `, [mesa.id]);

    // Buscar múltiplos pagamentos se existirem
    let pagamentos = [];
    if (mesa.multiplos_pagamentos) {
      const pagamentosResult = await db.query(`
        SELECT * FROM pagamentos_pedido 
        WHERE pedido_id = $1 
        ORDER BY created_at
      `, [mesa.id]);
      pagamentos = pagamentosResult.rows;
    }

    // Buscar configuração PIX (vamos criar uma tabela de configurações)
    const pixConfigResult = await db.query(`
      SELECT valor FROM configuracoes 
      WHERE chave = 'pix_qr_code' AND ativo = true
      LIMIT 1
    `);

    const pixQrCode = pixConfigResult.rows.length > 0 ? pixConfigResult.rows[0].valor : null;

    const resumoMesa = {
      ...mesa,
      itens: itensResult.rows,
      pagamentos: pagamentos,
      cliente: mesa.cliente_id ? {
        id: mesa.cliente_id,
        nome: mesa.cliente_nome,
        telefone: mesa.cliente_telefone,
        endereco: mesa.cliente_endereco
      } : null,
      pix_qr_code: pixQrCode
    };

    res.json({ mesa: resumoMesa });
  } catch (error) {
    console.error('Erro ao buscar resumo da mesa:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/orders/mesa/:numero/fechar - Fechar mesa individualmente
router.post('/mesa/:numero/fechar', authenticateToken, async (req, res) => {
  try {
    const { numero } = req.params;
    const { observacoes = '' } = req.body;
    
    // Verificar se existe mesa aberta com esse número
    const mesaResult = await db.query(`
      SELECT id FROM pedidos 
      WHERE numero_mesa = $1 
        AND tipo_pedido = 'mesa'
        AND status_pedido NOT IN ('entregue', 'fechada', 'cancelado')
    `, [numero]);

    if (mesaResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Mesa não encontrada ou já fechada' 
      });
    }

    const mesaId = mesaResult.rows[0].id;

    // Atualizar status da mesa para entregue (equivale a fechado para mesas)
    const updateResult = await db.query(`
      UPDATE pedidos 
      SET status_pedido = 'entregue',
          observacoes = CASE 
            WHEN observacoes IS NULL OR observacoes = '' 
            THEN $2 
            ELSE observacoes || ' | ' || $2 
          END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [mesaId, observacoes || `Mesa fechada em ${new Date().toLocaleString('pt-BR')}`]);

    // Invalidar caches relacionados
    invalidateOrderCaches(mesaId, null);

    console.log(`✅ Mesa ${numero} fechada com sucesso`);

    res.json({ 
      message: `Mesa ${numero} fechada com sucesso`,
      mesa: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao fechar mesa:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/orders/mesas/abertas - Listar mesas abertas
router.get('/mesas/abertas', authenticateToken, async (req, res) => {
  try {
    const mesasResult = await db.query(`
      SELECT 
        numero_mesa,
        COUNT(*) as total_pedidos,
        SUM(total) as valor_total,
        MIN(created_at) as abertura,
        MAX(updated_at) as ultima_atividade,
        MAX(status_pedido) as status_pedido
      FROM pedidos 
      WHERE tipo_pedido = 'mesa'
        AND status_pedido NOT IN ('entregue', 'fechada', 'cancelado')
        AND numero_mesa IS NOT NULL
      GROUP BY numero_mesa
      ORDER BY numero_mesa
    `);

    console.log(`✅ Mesas abertas encontradas: ${mesasResult.rows.length}`);
    res.json({ mesas: mesasResult.rows });
  } catch (error) {
    console.error('Erro ao buscar mesas abertas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/orders/mesa/:numero/fechar-conta - Fechar conta de uma mesa
router.post('/mesa/:numero/fechar-conta', authenticateToken, async (req, res) => {
  try {
    const { numero } = req.params;
    const { forma_pagamento, observacoes = '' } = req.body;
    
    console.log(`💰 [Orders] Fechando conta da mesa ${numero}...`);
    
    // Buscar pedidos da mesa com status 'retirado'
    const pedidosResult = await db.query(`
      SELECT id, total, cliente_id, status_pedido
      FROM pedidos 
      WHERE numero_mesa = $1 
        AND tipo_pedido = 'mesa'
        AND status_pedido IN ('retirado', 'pronto', 'preparando', 'pendente')
      ORDER BY created_at DESC
    `, [numero]);

    if (pedidosResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Mesa não encontrada ou já fechada' 
      });
    }

    console.log(`📋 [Orders] Encontrados ${pedidosResult.rows.length} pedidos para fechar`);

    // Atualizar todos os pedidos da mesa para 'fechada'
    const updatePromises = pedidosResult.rows.map(pedido => 
      db.query(`
        UPDATE pedidos 
        SET 
          status_pedido = 'fechada',
          forma_pagamento = COALESCE(forma_pagamento, $2),
          observacoes = COALESCE(observacoes, '') || CASE WHEN $3 != '' THEN E'\\n' || $3 ELSE '' END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [pedido.id, forma_pagamento, observacoes])
    );

    const updatedPedidos = await Promise.all(updatePromises);
    
    // Calcular total da mesa
    const totalMesa = pedidosResult.rows.reduce((sum, pedido) => sum + parseFloat(pedido.total || 0), 0);
    
    console.log(`✅ [Orders] Mesa ${numero} fechada. Total: R$ ${totalMesa.toFixed(2)}`);

    // Limpar cache relacionado
    cache.deletePattern(CacheKeys.DASHBOARD);
    cache.delete(CacheKeys.ACTIVE_ORDERS);
    
    res.json({ 
      success: true,
      mesa: numero,
      total: totalMesa,
      pedidos_fechados: updatedPedidos.length,
      forma_pagamento,
      message: `Mesa ${numero} fechada com sucesso!`
    });

  } catch (error) {
    console.error('❌ [Orders] Erro ao fechar conta da mesa:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Adicionar item a uma mesa existente
router.post('/mesa/:numero/adicionar-item', authenticateToken, async (req, res) => {
  try {
    const numero = parseInt(req.params.numero);
    const { produto_id, quantidade = 1 } = req.body;

    console.log(`📝 [Orders] Adicionando item à mesa ${numero}:`, { produto_id, quantidade });

    if (!produto_id || !quantidade) {
      return res.status(400).json({ 
        error: 'Produto e quantidade são obrigatórios' 
      });
    }

    // Buscar produto para validar e obter informações
    const produtoResult = await db.query(`
      SELECT id, nome, preco_unitario, tipo_produto 
      FROM produtos 
      WHERE id = $1 AND ativo = true
    `, [produto_id]);

    if (produtoResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Produto não encontrado ou inativo' 
      });
    }

    const produto = produtoResult.rows[0];

    // Buscar pedido ativo da mesa (status 'retirado' = mesa consumindo)
    const pedidoResult = await db.query(`
      SELECT id, total, cliente_id, status_pedido
      FROM pedidos 
      WHERE numero_mesa = $1 
        AND tipo_pedido = 'mesa'
        AND status_pedido IN ('retirado', 'pronto', 'preparando', 'pendente')
      ORDER BY created_at DESC
      LIMIT 1
    `, [numero]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Mesa não encontrada ou não está em consumo' 
      });
    }

    const pedido = pedidoResult.rows[0];
    const valor_unitario = parseFloat(produto.preco_unitario || 0);
    const valor_total_item = valor_unitario * quantidade;

    // Adicionar item ao pedido
    await db.query(`
      INSERT INTO itens_pedido (
        pedido_id, produto_id_ref, sabor_registrado, 
        quantidade, valor_unitario
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      pedido.id,
      produto.id,
      produto.nome,
      parseInt(quantidade),
      valor_unitario
    ]);

    // Atualizar total do pedido
    const novo_total = parseFloat(pedido.total) + valor_total_item;
    await db.query(`
      UPDATE pedidos 
      SET total = $1, updated_at = NOW()
      WHERE id = $2
    `, [novo_total, pedido.id]);

    console.log(`✅ [Orders] Item adicionado à mesa ${numero}. Novo total: R$ ${novo_total.toFixed(2)}`);

    // Limpar cache relacionado
    cache.deletePattern(CacheKeys.DASHBOARD);
    cache.delete(CacheKeys.ACTIVE_ORDERS);
    
    res.json({ 
      success: true,
      item: {
        produto_nome: produto.nome,
        quantidade,
        valor_unitario,
        valor_total: valor_total_item
      },
      novo_total_pedido: novo_total,
      message: `${quantidade}x ${produto.nome} adicionado à mesa ${numero}`
    });

  } catch (error) {
    console.error('❌ [Orders] Erro ao adicionar item à mesa:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 