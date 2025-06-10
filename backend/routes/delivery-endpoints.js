const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// 📱 ENDPOINTS PARA APP FLUTTER - ENTREGADORES

// 1. Listar todos os pedidos de delivery (sem filtro de aceito/não aceito)
router.get('/pedidos-delivery', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.total,
        p.endereco_entrega,
        p.status_pedido,
        p.entregador_nome,
        p.data_pedido,
        p.created_at,
        p.observacoes,
        p.taxa_entrega,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco_completo
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.tipo_pedido = 'delivery'
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    // Formatar dados para o Flutter
    const pedidos = result.rows.map(pedido => ({
      id: pedido.id,
      total: parseFloat(pedido.total),
      endereco: pedido.endereco_entrega || pedido.cliente_endereco_completo,
      status: pedido.status_pedido,
      entregador: pedido.entregador_nome,
      data_pedido: pedido.data_pedido,
      observacoes: pedido.observacoes,
      taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
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
    console.error('Erro ao buscar pedidos delivery:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// 2. Buscar pedido específico por ID
router.get('/pedido/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco_completo,
        c.email as cliente_email
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.id = $1 AND p.tipo_pedido = 'delivery'
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const pedido = result.rows[0];
    
    // Buscar itens do pedido
    const itensQuery = `
      SELECT 
        ip.*,
        pr.nome as produto_nome,
        pr.descricao as produto_descricao
      FROM itens_pedido ip
      LEFT JOIN produtos pr ON ip.produto_id = pr.id
      WHERE ip.pedido_id = $1
    `;
    
    const itensResult = await pool.query(itensQuery, [id]);
    
    const pedidoCompleto = {
      id: pedido.id,
      total: parseFloat(pedido.total),
      endereco: pedido.endereco_entrega || pedido.cliente_endereco_completo,
      status: pedido.status_pedido,
      entregador: pedido.entregador_nome,
      data_pedido: pedido.data_pedido,
      observacoes: pedido.observacoes,
      taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
      forma_pagamento: pedido.forma_pagamento,
      cliente: {
        nome: pedido.cliente_nome,
        telefone: pedido.cliente_telefone,
        email: pedido.cliente_email
      },
      itens: itensResult.rows.map(item => ({
        id: item.id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_unitario: parseFloat(item.preco_unitario),
        subtotal: parseFloat(item.subtotal)
      }))
    };

    res.json({
      success: true,
      pedido: pedidoCompleto
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// 3. Filtrar pedidos por status (para o app escolher quais mostrar)
router.get('/pedidos-por-status/:status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.params;
    
    const query = `
      SELECT 
        p.id,
        p.total,
        p.endereco_entrega,
        p.status_pedido,
        p.entregador_nome,
        p.data_pedido,
        p.observacoes,
        p.taxa_entrega,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p 
      LEFT JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.tipo_pedido = 'delivery' AND p.status_pedido = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [status]);
    
    const pedidos = result.rows.map(pedido => ({
      id: pedido.id,
      total: parseFloat(pedido.total),
      endereco: pedido.endereco_entrega,
      status: pedido.status_pedido,
      entregador: pedido.entregador_nome,
      data_pedido: pedido.data_pedido,
      observacoes: pedido.observacoes,
      taxa_entrega: parseFloat(pedido.taxa_entrega || 0),
      cliente: {
        nome: pedido.cliente_nome,
        telefone: pedido.cliente_telefone
      }
    }));

    res.json({
      success: true,
      status: status,
      total: pedidos.length,
      pedidos: pedidos
    });

  } catch (error) {
    console.error('Erro ao buscar pedidos por status:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// 4. Atualizar status do pedido (simples)
router.put('/pedido/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, entregador_nome } = req.body;
    
    let query = 'UPDATE pedidos SET status_pedido = $1 WHERE id = $2';
    let params = [status, id];
    
    // Se enviou nome do entregador, atualiza também
    if (entregador_nome) {
      query = 'UPDATE pedidos SET status_pedido = $1, entregador_nome = $2 WHERE id = $3';
      params = [status, entregador_nome, id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      pedido_id: id,
      novo_status: status
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// 5. Estatísticas simples para o app
router.get('/estatisticas', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN status_pedido = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status_pedido = 'preparando' THEN 1 END) as preparando,
        COUNT(CASE WHEN status_pedido = 'saiu_para_entrega' THEN 1 END) as em_entrega,
        COUNT(CASE WHEN status_pedido = 'entregue' THEN 1 END) as entregues,
        SUM(total) as valor_total
      FROM pedidos 
      WHERE tipo_pedido = 'delivery' 
      AND DATE(created_at) = CURRENT_DATE
    `;
    
    const result = await pool.query(query);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      estatisticas_hoje: {
        total_pedidos: parseInt(stats.total_pedidos),
        pendentes: parseInt(stats.pendentes),
        preparando: parseInt(stats.preparando),
        em_entrega: parseInt(stats.em_entrega),
        entregues: parseInt(stats.entregues),
        valor_total: parseFloat(stats.valor_total || 0)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router; 