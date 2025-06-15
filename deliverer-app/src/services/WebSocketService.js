import { WS_BASE_URL } from '../utils/constants';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 segundos
    this.listeners = {
      newOrder: [],
      orderUpdate: [],
      connected: [],
      disconnected: [],
      error: []
    };
  }

  connect(token) {
    if (this.ws && this.isConnected) {
      console.log('WebSocket já está conectado');
      return;
    }

    this.token = token;
    
    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/ws/deliverer`);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket conectado');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Enviar token de autenticação
        this.send({
          type: 'auth',
          token: this.token
        });
        
        // Notificar listeners
        this.listeners.connected.forEach(callback => callback());
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado', event.code, event.reason);
        this.isConnected = false;
        
        // Notificar listeners
        this.listeners.disconnected.forEach(callback => callback(event));
        
        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro WebSocket:', error);
        
        // Notificar listeners
        this.listeners.error.forEach(callback => callback(error));
      };

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  }

  handleMessage(data) {
    console.log('📨 Mensagem WebSocket recebida:', data);

    switch (data.type) {
      case 'auth_success':
        console.log('✅ Autenticação WebSocket bem-sucedida');
        break;

      case 'auth_error':
        console.error('❌ Erro de autenticação WebSocket:', data.message);
        this.disconnect();
        break;

      case 'new_order':
        console.log('🆕 Novo pedido recebido via WebSocket');
        this.listeners.newOrder.forEach(callback => callback(data.data));
        break;

      case 'order_update':
        console.log('🔄 Atualização de pedido recebida via WebSocket');
        this.listeners.orderUpdate.forEach(callback => callback(data.data));
        break;

      case 'pong':
        // Resposta ao ping - mantém conexão viva
        break;

      default:
        console.log('Tipo de mensagem WebSocket não reconhecido:', data.type);
    }
  }

  send(data) {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Erro ao enviar mensagem WebSocket:', error);
      }
    } else {
      console.warn('WebSocket não está conectado - mensagem não enviada');
    }
  }

  disconnect() {
    console.log('🔌 Desconectando WebSocket');
    
    if (this.ws) {
      this.ws.close(1000, 'Desconexão intencional');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.token = null;
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    
    console.log(
      `🔄 Agendando reconexão WebSocket (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts}) em ${this.reconnectInterval/1000}s`
    );
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, this.reconnectInterval);
  }

  // LISTENERS PARA EVENTOS
  onNewOrder(callback) {
    this.listeners.newOrder.push(callback);
  }

  onOrderUpdate(callback) {
    this.listeners.orderUpdate.push(callback);
  }

  onConnected(callback) {
    this.listeners.connected.push(callback);
  }

  onDisconnected(callback) {
    this.listeners.disconnected.push(callback);
  }

  onError(callback) {
    this.listeners.error.push(callback);
  }

  // REMOVER LISTENERS
  removeListener(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  // STATUS DA CONEXÃO
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      hasToken: !!this.token
    };
  }

  // PING PARA MANTER CONEXÃO VIVA
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping a cada 30 segundos
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const WebSocketService = new WebSocketService();