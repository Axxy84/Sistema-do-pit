const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/env');

const router = express.Router();

// Middleware de autenticação específico para entregadores
const authenticateDeliverer = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    // Verificar se é um token de entregador
    if (decoded.type !== 'deliverer') {
      return res.status(403).json({ error: 'Token de entregador necessário' });
    }
    
    req.deliverer = decoded;
    next();
  });
};

// Função para gerar token JWT específico para entregador
const generateDelivererToken = (delivererId, nome, telefone) => {
  return jwt.sign(
    { 
      delivererId, 
      nome,
      telefone,
      type: 'deliverer' 
    }, 
    config.JWT_SECRET, 
    { expiresIn: '30d' } // Token válido por 30 dias para o app
  );
};

// 📱 AUTENTICAÇÃO DE ENTREGADOR

// Login do entregador (usando telefone como identificador)
router.post('/auth/login', async (req, res) => {
  try {
    const { telefone, senha } = req.body;

    if (!telefone || !senha) {
      return res.status(400).json({ 
        error: 'Telefone e senha são obrigatórios' 
      });
    }

    // Buscar entregador pelo telefone
    const result = await db.query(`
      SELECT id, nome, telefone, senha_hash, ativo 
      FROM entregadores 
      WHERE telefone = $1
    `, [telefone]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Telefone não encontrado' 
      });
    }

    const entregador = result.rows[0];

    // Verificar se está ativo
    if (!entregador.ativo) {
      return res.status(401).json({ 
        error: 'Entregador inativo. Entre em contato com o gerente.' 
      });
    }

    // Verificar senha
    if (!entregador.senha_hash) {
      return res.status(401).json({ 
        error: 'Senha não configurada. Entre em contato com o gerente.' 
      });
    }

    const isPasswordValid = await bcrypt.compare(senha, entregador.senha_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Senha incorreta' 
      });
    }

    // Gerar token
    const token = generateDelivererToken(entregador.id, entregador.nome, entregador.telefone);

    // Atualizar último login
    await db.query(
      'UPDATE entregadores SET ultimo_login = NOW() WHERE id = $1',
      [entregador.id]
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      entregador: {
        id: entregador.id,
        nome: entregador.nome,
        telefone: entregador.telefone
      },
      token
    });

  } catch (error) {
    console.error('Erro no login do entregador:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível fazer login'
    });
  }
});

// Verificar token atual do entregador
router.get('/auth/me', authenticateDeliverer, async (req, res) => {
  try {
    // Buscar dados atualizados do entregador
    const result = await db.query(`
      SELECT id, nome, telefone, ativo 
      FROM entregadores 
      WHERE id = $1
    `, [req.deliverer.delivererId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entregador não encontrado' });
    }

    const entregador = result.rows[0];

    if (!entregador.ativo) {
      return res.status(401).json({ 
        error: 'Entregador inativo. Entre em contato com o gerente.' 
      });
    }

    res.json({
      success: true,
      entregador: {
        id: entregador.id,
        nome: entregador.nome,
        telefone: entregador.telefone
      }
    });

  } catch (error) {
    console.error('Erro ao verificar entregador:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// 📱 GESTÃO DE PEDIDOS PARA ENTREGADOR

// Listar pedidos disponíveis para entrega (sem entregador atribuído)
router.get('/pedidos/disponiveis', authenticateDeliverer, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.total,
        p.endereco_entrega,
        p.status_pedido,
        p.data_pedido,
        p.created_at,
        p.observacoes,
        p.taxa_entrega,
        p.forma_pagamento,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.tipo_pedido = 'delivery' 
        AND p.status_pedido IN ('preparando', 'pronto')
        AND (p.entregador_id IS NULL OR p.entregador_id = '')
      ORDER BY p.created_at ASC
      LIMIT 10
    `;
    
    const result = await db.query(query);
    
    const pedidos = result.rows.map(pedido => ({
      id: pedido.id,
      total: parseFloat(pedido.total),
      endereco: pedido.endereco_entrega,
      status: pedido.status_pedido,
      data_pedido: pedido.data_pedido,
      observacoes: pedido.observacoes,
      taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
      forma_pagamento: pedido.forma_pagamento,
      tempo_espera: Math.floor((new Date() - new Date(pedido.created_at)) / 60000), // em minutos
      cliente: {
        nome: pedido.cliente_nome,
        telefone: pedido.cliente_telefone
      }
    }));

    res.json({
      success: true,
      total: pedidos.length,
      pedidos: pedidos
    });

  } catch (error) {
    console.error('Erro ao buscar pedidos disponíveis:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Aceitar um pedido para entrega
router.post('/pedidos/:id/aceitar', authenticateDeliverer, async (req, res) => {
  try {
    const { id } = req.params;
    const entregadorId = req.deliverer.delivererId;
    const entregadorNome = req.deliverer.nome;

    // Verificar se o pedido ainda está disponível
    const checkResult = await db.query(`
      SELECT id, status_pedido, entregador_id 
      FROM pedidos 
      WHERE id = $1 AND tipo_pedido = 'delivery'
    `, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const pedido = checkResult.rows[0];

    if (pedido.entregador_id && pedido.entregador_id !== entregadorId) {
      return res.status(409).json({ 
        error: 'Pedido já foi aceito por outro entregador' 
      });
    }

    if (!['preparando', 'pronto'].includes(pedido.status_pedido)) {
      return res.status(400).json({ 
        error: 'Pedido não está disponível para entrega' 
      });
    }

    // Atribuir pedido ao entregador
    const updateResult = await db.query(`
      UPDATE pedidos 
      SET entregador_id = $1, 
          entregador_nome = $2,
          status_pedido = 'saiu_para_entrega',
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [entregadorId, entregadorNome, id]);

    res.json({
      success: true,
      message: 'Pedido aceito com sucesso',
      pedido: {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status_pedido
      }
    });

  } catch (error) {
    console.error('Erro ao aceitar pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Listar pedidos do entregador (aceitos por ele)
router.get('/pedidos/meus', authenticateDeliverer, async (req, res) => {
  try {
    const entregadorId = req.deliverer.delivererId;
    const status = req.query.status; // Filtro opcional por status

    let query = `
      SELECT 
        p.id,
        p.total,
        p.endereco_entrega,
        p.status_pedido,
        p.data_pedido,
        p.created_at,
        p.observacoes,
        p.taxa_entrega,
        p.forma_pagamento,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.tipo_pedido = 'delivery' 
        AND p.entregador_id = $1
    `;

    const params = [entregadorId];

    if (status) {
      query += ' AND p.status_pedido = $2';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC LIMIT 20';
    
    const result = await db.query(query, params);
    
    const pedidos = result.rows.map(pedido => ({
      id: pedido.id,
      total: parseFloat(pedido.total),
      endereco: pedido.endereco_entrega,
      status: pedido.status_pedido,
      data_pedido: pedido.data_pedido,
      observacoes: pedido.observacoes,
      taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
      forma_pagamento: pedido.forma_pagamento,
      cliente: {
        nome: pedido.cliente_nome,
        telefone: pedido.cliente_telefone
      }
    }));

    res.json({
      success: true,
      total: pedidos.length,
      pedidos: pedidos
    });

  } catch (error) {
    console.error('Erro ao buscar pedidos do entregador:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Marcar pedido como entregue
router.post('/pedidos/:id/entregar', authenticateDeliverer, async (req, res) => {
  try {
    const { id } = req.params;
    const entregadorId = req.deliverer.delivererId;

    // Verificar se o pedido pertence ao entregador
    const checkResult = await db.query(`
      SELECT id, status_pedido, entregador_id 
      FROM pedidos 
      WHERE id = $1 AND entregador_id = $2
    `, [id, entregadorId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Pedido não encontrado ou não pertence a você' 
      });
    }

    const pedido = checkResult.rows[0];

    if (pedido.status_pedido !== 'saiu_para_entrega') {
      return res.status(400).json({ 
        error: 'Pedido não está em status de entrega' 
      });
    }

    // Marcar como entregue
    const updateResult = await db.query(`
      UPDATE pedidos 
      SET status_pedido = 'entregue',
          data_entrega = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    res.json({
      success: true,
      message: 'Pedido marcado como entregue',
      pedido: {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status_pedido,
        data_entrega: updateResult.rows[0].data_entrega
      }
    });

  } catch (error) {
    console.error('Erro ao marcar pedido como entregue:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Detalhes completos de um pedido
router.get('/pedidos/:id/detalhes', authenticateDeliverer, async (req, res) => {
  try {
    const { id } = req.params;
    const entregadorId = req.deliverer.delivererId;

    // Buscar pedido
    const pedidoQuery = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco_completo
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.id = $1 AND p.tipo_pedido = 'delivery'
        AND (p.entregador_id = $2 OR p.entregador_id IS NULL)
    `;
    
    const pedidoResult = await db.query(pedidoQuery, [id, entregadorId]);
    
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const pedido = pedidoResult.rows[0];
    
    // Buscar itens do pedido
    const itensQuery = `
      SELECT 
        ip.*,
        pr.nome as produto_nome,
        pr.descricao as produto_descricao
      FROM itens_pedido ip
      LEFT JOIN produtos pr ON ip.produto_id = pr.id
      WHERE ip.pedido_id = $1
      ORDER BY ip.id
    `;
    
    const itensResult = await db.query(itensQuery, [id]);
    
    const pedidoCompleto = {
      id: pedido.id,
      total: parseFloat(pedido.total),
      endereco: pedido.endereco_entrega || pedido.cliente_endereco_completo,
      status: pedido.status_pedido,
      entregador_nome: pedido.entregador_nome,
      data_pedido: pedido.data_pedido,
      observacoes: pedido.observacoes,
      taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
      forma_pagamento: pedido.forma_pagamento,
      troco_para: parseFloat(pedido.troco_para || 0),
      cliente: {
        nome: pedido.cliente_nome,
        telefone: pedido.cliente_telefone
      },
      itens: itensResult.rows.map(item => ({
        id: item.id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_unitario: parseFloat(item.preco_unitario),
        subtotal: parseFloat(item.subtotal),
        observacoes: item.observacoes
      }))
    };

    res.json({
      success: true,
      pedido: pedidoCompleto
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Histórico de entregas do entregador
router.get('/historico', authenticateDeliverer, async (req, res) => {
  try {
    const entregadorId = req.deliverer.delivererId;
    const limite = parseInt(req.query.limite) || 50;
    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * limite;

    const query = `
      SELECT 
        p.id,
        p.total,
        p.endereco_entrega,
        p.status_pedido,
        p.data_pedido,
        p.data_entrega,
        p.taxa_entrega,
        c.nome as cliente_nome
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.tipo_pedido = 'delivery' 
        AND p.entregador_id = $1
        AND p.status_pedido = 'entregue'
      ORDER BY p.data_entrega DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [entregadorId, limite, offset]);
    
    // Contar total de entregas
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM pedidos 
      WHERE tipo_pedido = 'delivery' 
        AND entregador_id = $1
        AND status_pedido = 'entregue'
    `, [entregadorId]);

    const historico = result.rows.map(pedido => ({
      id: pedido.id,
      total: parseFloat(pedido.total),
      endereco: pedido.endereco_entrega,
      data_pedido: pedido.data_pedido,
      data_entrega: pedido.data_entrega,
      taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
      cliente_nome: pedido.cliente_nome
    }));

    res.json({
      success: true,
      total_registros: parseInt(countResult.rows[0].total),
      pagina: pagina,
      limite: limite,
      historico: historico
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router;