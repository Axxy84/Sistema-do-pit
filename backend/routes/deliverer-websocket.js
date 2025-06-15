const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

class DelivererWebSocketManager {
  constructor() {
    this.connectedDeliverers = new Map(); // Map<delivererId, WebSocket>
    this.wss = null;
  }

  // Inicializar WebSocket Server
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/deliverer'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 Nova conexão WebSocket de entregador');

      // Aguardar autenticação
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'auth') {
            this.authenticateDeliverer(ws, data.token);
          } else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Formato de mensagem inválido' 
          }));
        }
      });

      ws.on('close', () => {
        // Remover entregador da lista de conectados
        for (const [delivererId, socket] of this.connectedDeliverers.entries()) {
          if (socket === ws) {
            this.connectedDeliverers.delete(delivererId);
            console.log(`📱 Entregador ${delivererId} desconectou do WebSocket`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('Erro WebSocket:', error);
      });
    });

    console.log('🚀 WebSocket Server para entregadores inicializado em /ws/deliverer');
  }

  // Autenticar entregador via token JWT
  authenticateDeliverer(ws, token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      if (decoded.type !== 'deliverer') {
        throw new Error('Token não é de entregador');
      }

      const delivererId = decoded.delivererId;
      
      // Adicionar à lista de conectados
      this.connectedDeliverers.set(delivererId, ws);
      
      console.log(`✅ Entregador ${decoded.nome} (ID: ${delivererId}) autenticado no WebSocket`);
      
      ws.send(JSON.stringify({
        type: 'auth_success',
        message: 'Conectado com sucesso',
        deliverer: {
          id: delivererId,
          nome: decoded.nome
        }
      }));

    } catch (error) {
      console.error('Erro na autenticação WebSocket:', error);
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Token inválido'
      }));
      ws.close();
    }
  }

  // Notificar todos os entregadores sobre novo pedido
  notifyNewOrder(pedidoData) {
    const message = JSON.stringify({
      type: 'new_order',
      data: {
        id: pedidoData.id,
        total: pedidoData.total,
        endereco: pedidoData.endereco_entrega,
        cliente_nome: pedidoData.cliente_nome,
        observacoes: pedidoData.observacoes,
        taxa_entrega: pedidoData.taxa_entrega,
        timestamp: new Date().toISOString()
      }
    });

    let notifiedCount = 0;
    
    this.connectedDeliverers.forEach((ws, delivererId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        notifiedCount++;
      } else {
        // Remover conexões mortas
        this.connectedDeliverers.delete(delivererId);
      }
    });

    console.log(`📲 Novo pedido notificado para ${notifiedCount} entregadores conectados`);
    return notifiedCount;
  }

  // Notificar entregador específico sobre status do pedido
  notifyDelivererOrderUpdate(delivererId, pedidoData) {
    const ws = this.connectedDeliverers.get(delivererId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'order_update',
        data: pedidoData
      }));
      
      console.log(`📱 Atualização de pedido enviada para entregador ${delivererId}`);
      return true;
    }
    
    return false;
  }

  // Obter estatísticas de conexões
  getStats() {
    return {
      connected_deliverers: this.connectedDeliverers.size,
      active_connections: Array.from(this.connectedDeliverers.values())
        .filter(ws => ws.readyState === WebSocket.OPEN).length
    };
  }

  // Broadcast geral para todos os entregadores
  broadcast(message) {
    const data = JSON.stringify(message);
    let sentCount = 0;

    this.connectedDeliverers.forEach((ws, delivererId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
        sentCount++;
      }
    });

    return sentCount;
  }
}

// Singleton instance
const delivererWS = new DelivererWebSocketManager();

module.exports = delivererWS;