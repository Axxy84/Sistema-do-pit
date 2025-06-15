import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { DatabaseService } from './DatabaseService';
import { WebSocketService } from './WebSocketService';
import Toast from 'react-native-toast-message';

class OrderService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
  }

  // OPERAÇÕES DE PEDIDOS ONLINE
  async getAvailableOrders() {
    try {
      const response = await axios.get(`${API_BASE_URL}/deliverer-app/pedidos/disponiveis`);
      
      if (response.data.success) {
        // Cache dos pedidos disponíveis
        for (const order of response.data.pedidos) {
          await DatabaseService.cacheOrder(order);
        }
        
        return {
          success: true,
          orders: response.data.pedidos
        };
      } else {
        throw new Error(response.data.error || 'Erro ao buscar pedidos');
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
      
      // Se offline, buscar do cache
      if (!this.isOnline) {
        const cachedOrders = await DatabaseService.getCachedOrders('preparando');
        return {
          success: true,
          orders: cachedOrders,
          fromCache: true
        };
      }
      
      throw error;
    }
  }

  async getMyOrders(status = null) {
    try {
      const url = status 
        ? `${API_BASE_URL}/deliverer-app/pedidos/meus?status=${status}`
        : `${API_BASE_URL}/deliverer-app/pedidos/meus`;
        
      const response = await axios.get(url);
      
      if (response.data.success) {
        // Cache dos meus pedidos
        for (const order of response.data.pedidos) {
          await DatabaseService.cacheOrder(order);
        }
        
        return {
          success: true,
          orders: response.data.pedidos
        };
      } else {
        throw new Error(response.data.error || 'Erro ao buscar meus pedidos');
      }
    } catch (error) {
      console.error('Erro ao buscar meus pedidos:', error);
      
      // Se offline, buscar do cache
      if (!this.isOnline) {
        const cachedOrders = await DatabaseService.getCachedOrders(status);
        return {
          success: true,
          orders: cachedOrders,
          fromCache: true
        };
      }
      
      throw error;
    }
  }

  async getOrderDetails(orderId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/deliverer-app/pedidos/${orderId}/detalhes`);
      
      if (response.data.success) {
        // Cache do pedido detalhado
        await DatabaseService.cacheOrder(response.data.pedido);
        
        return {
          success: true,
          order: response.data.pedido
        };
      } else {
        throw new Error(response.data.error || 'Erro ao buscar detalhes do pedido');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      
      // Tentar buscar do cache
      const cachedOrders = await DatabaseService.getCachedOrders();
      const cachedOrder = cachedOrders.find(order => order.id === orderId);
      
      if (cachedOrder) {
        return {
          success: true,
          order: cachedOrder,
          fromCache: true
        };
      }
      
      throw error;
    }
  }

  async acceptOrder(orderId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/deliverer-app/pedidos/${orderId}/aceitar`);
      
      if (response.data.success) {
        // Atualizar cache local
        await DatabaseService.updateCachedOrderStatus(orderId, 'saiu_para_entrega');
        
        // Log da ação
        await DatabaseService.addLog('info', 'Pedido aceito', { orderId });
        
        Toast.show({
          type: 'success',
          text1: 'Pedido aceito!',
          text2: 'Você está responsável por esta entrega',
        });
        
        return {
          success: true,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.error || 'Erro ao aceitar pedido');
      }
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      
      let errorMessage = 'Erro ao aceitar pedido';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      });
      
      throw new Error(errorMessage);
    }
  }

  async markAsDelivered(orderId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/deliverer-app/pedidos/${orderId}/entregar`);
      
      if (response.data.success) {
        // Buscar dados do pedido para o histórico
        const orderData = await this.getOrderDetails(orderId);
        
        if (orderData.success) {
          // Salvar no histórico local
          await DatabaseService.saveDeliveryHistory(orderData.order);
          
          // Atualizar cache
          await DatabaseService.updateCachedOrderStatus(orderId, 'entregue');
          
          // Log da ação
          await DatabaseService.addLog('info', 'Pedido entregue', { orderId });
        }
        
        Toast.show({
          type: 'success',
          text1: 'Entrega confirmada!',
          text2: 'Pedido marcado como entregue',
        });
        
        return {
          success: true,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.error || 'Erro ao marcar como entregue');
      }
    } catch (error) {
      console.error('Erro ao marcar como entregue:', error);
      
      // Se offline, salvar ação para sincronizar depois
      if (!this.isOnline) {
        await DatabaseService.addLog('pending_action', 'mark_delivered', { orderId });
        
        Toast.show({
          type: 'info',
          text1: 'Ação salva offline',
          text2: 'Será sincronizada quando conectar',
        });
        
        return { success: true, offline: true };
      }
      
      let errorMessage = 'Erro ao marcar como entregue';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      });
      
      throw new Error(errorMessage);
    }
  }

  async getDeliveryHistory(limit = 50) {
    try {
      const response = await axios.get(`${API_BASE_URL}/deliverer-app/historico?limite=${limit}`);
      
      if (response.data.success) {
        return {
          success: true,
          history: response.data.historico,
          total: response.data.total_registros
        };
      } else {
        throw new Error(response.data.error || 'Erro ao buscar histórico');
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      
      // Se offline, buscar do banco local
      const localHistory = await DatabaseService.getDeliveryHistory(limit);
      
      return {
        success: true,
        history: localHistory,
        fromCache: true
      };
    }
  }

  // SINCRONIZAÇÃO OFFLINE/ONLINE
  async syncPendingActions() {
    if (this.syncInProgress) {
      return;
    }

    try {
      this.syncInProgress = true;
      
      // Buscar ações pendentes dos logs
      const logs = await DatabaseService.getLogs(100);
      const pendingActions = logs.filter(log => log.level === 'pending_action');
      
      for (const action of pendingActions) {
        try {
          const actionData = JSON.parse(action.data);
          
          if (action.message === 'mark_delivered') {
            await this.markAsDelivered(actionData.orderId);
            // Marcar como sincronizado seria aqui, mas como o markAsDelivered já faz isso, não precisamos
          }
          
          // Remover ação dos logs após sincronização bem-sucedida
          // Você poderia implementar uma função para isso
          
        } catch (syncError) {
          console.error('Erro ao sincronizar ação:', syncError);
        }
      }
      
      // Sincronizar histórico local com servidor
      await this.syncLocalHistory();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncLocalHistory() {
    try {
      const localHistory = await DatabaseService.getDeliveryHistory();
      const unsyncedItems = localHistory.filter(item => item.sync_status === 'pending');
      
      for (const item of unsyncedItems) {
        try {
          // Aqui você poderia enviar para um endpoint de sincronização
          // Por enquanto, apenas marcar como sincronizado
          await DatabaseService.markHistoryAsSynced(item.local_id);
        } catch (error) {
          console.error('Erro ao sincronizar item do histórico:', error);
        }
      }
      
    } catch (error) {
      console.error('Erro na sincronização do histórico:', error);
    }
  }

  // CONFIGURAÇÕES DE CONECTIVIDADE
  setOnlineStatus(isOnline) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;
    
    // Se ficou online após estar offline, sincronizar
    if (isOnline && wasOffline) {
      this.syncPendingActions();
    }
  }

  getOnlineStatus() {
    return this.isOnline;
  }

  // INICIALIZAÇÃO DO WEBSOCKET
  initializeWebSocket(token) {
    WebSocketService.connect(token);
    
    // Configurar listeners para novos pedidos
    WebSocketService.onNewOrder((orderData) => {
      Toast.show({
        type: 'info',
        text1: 'Novo pedido disponível!',
        text2: `${orderData.cliente_nome} - R$ ${orderData.total}`,
      });
      
      // Cache do novo pedido
      DatabaseService.cacheOrder(orderData);
    });
    
    WebSocketService.onOrderUpdate((orderData) => {
      // Atualizar cache com dados atualizados
      DatabaseService.cacheOrder(orderData);
    });
  }

  disconnectWebSocket() {
    WebSocketService.disconnect();
  }
}

export const OrderService = new OrderService();