import { apiClient } from '@/lib/apiClient';

export const orderService = {
  async getAllOrders(filters = {}) {
    try {
      // TEMPORÁRIO: Dados simulados para evitar travamento
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const mockOrders = [
        {
          id: 1,
          cliente_id: { nome: 'João Silva', telefone: '11999999999' },
          status_pedido: 'pendente',
          tipo_pedido: 'delivery',
          total: 45.90,
          data_pedido: new Date().toISOString(),
          observacoes: 'Sem cebola',
          forma_pagamento: 'dinheiro',
          itens_pedido: [
            { id: 1, produto_id: 1, quantidade: 1, valor_unitario: 35.90, observacoes: 'Sem cebola' },
            { id: 2, produto_id: 3, quantidade: 1, valor_unitario: 8.50, observacoes: '' }
          ]
        },
        {
          id: 2,
          cliente_id: { nome: 'Maria Santos', telefone: '11888888888' },
          status_pedido: 'preparando',
          tipo_pedido: 'balcao',
          total: 32.50,
          data_pedido: new Date(Date.now() - 30*60*1000).toISOString(),
          observacoes: '',
          forma_pagamento: 'cartao',
          itens_pedido: [
            { id: 3, produto_id: 4, quantidade: 1, valor_unitario: 32.50, observacoes: '' }
          ]
        },
        {
          id: 3,
          cliente_id: { nome: 'Pedro Costa', telefone: '11777777777' },
          status_pedido: 'entregue',
          tipo_pedido: 'delivery',
          total: 67.80,
          data_pedido: new Date(Date.now() - 2*60*60*1000).toISOString(),
          observacoes: 'Apartamento 101',
          forma_pagamento: 'pix',
          itens_pedido: [
            { id: 4, produto_id: 2, quantidade: 1, valor_unitario: 42.90, observacoes: '' },
            { id: 5, produto_id: 1, quantidade: 1, valor_unitario: 24.90, observacoes: 'Pizza pequena' }
          ]
        }
      ];
      
      // Aplicar filtros básicos
      let filteredOrders = mockOrders;
      if (filters.status) {
        filteredOrders = filteredOrders.filter(order => order.status_pedido === filters.status);
      }
      
      return filteredOrders;
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      throw error;
    }
  },

  async getOrderById(orderId) {
    try {
      const data = await apiClient.get(`/orders/${orderId}`);
      return data.order;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error.message);
      throw error;
    }
  },

  async saveOrder(orderPayload, itemsData, currentOrderDetails) {
    try {
      // TEMPORÁRIO: Simular salvamento de pedido
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let savedOrder;
      if (currentOrderDetails?.id) {
        // Simular atualização de pedido existente
        console.log('[OrderService] Atualizando pedido simulado:', currentOrderDetails.id);
        savedOrder = {
          id: currentOrderDetails.id,
          ...orderPayload,
          items: itemsData,
          updated_at: new Date().toISOString()
        };
      } else {
        // Simular criação de novo pedido
        console.log('[OrderService] Criando novo pedido simulado');
        savedOrder = {
          id: Math.floor(Math.random() * 10000) + 1000, // ID aleatório para simular
          ...orderPayload,
          items: itemsData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      console.log('[OrderService] Pedido salvo com sucesso (simulado):', savedOrder);
      return savedOrder;
    } catch (error) {
      console.error('Error saving order:', error.message);
      throw error;
    }
  },

  async createOrder(orderData) {
    try {
      const data = await apiClient.post('/orders', orderData);
      return data.order;
    } catch (error) {
      console.error('Error creating order:', error.message);
      throw error;
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      // TEMPORÁRIO: Simular atualização de status
      await new Promise(resolve => setTimeout(resolve, 400));
      console.log(`[OrderService] Status do pedido ${orderId} atualizado para: ${newStatus} (simulado)`);
      
      const updatedOrder = {
        id: orderId,
        status_pedido: newStatus,
        updated_at: new Date().toISOString()
      };
      
      return updatedOrder;
    } catch (error) {
      console.error(`Error updating status for order ${orderId}:`, error.message);
      throw error;
    }
  },

  async deleteOrder(orderId) {
    try {
      // TEMPORÁRIO: Simular exclusão de pedido
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('[OrderService] Pedido deletado com sucesso (simulado):', orderId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting order:', error.message);
      throw error;
    }
  },

  // Métodos auxiliares para clientes e cupons
  async getCustomers() {
    try {
      const data = await apiClient.get('/clients');
      return data.clients || [];
    } catch (error) {
      console.error('Error fetching customers:', error.message);
      throw error;
    }
  },

  async getDeliverers() {
    try {
      const data = await apiClient.get('/deliverers');
      return data.deliverers || [];
    } catch (error) {
      console.error('Error fetching deliverers:', error.message);
      throw error;
    }
  },

  async getActiveDeliverers() {
    try {
      const data = await apiClient.get('/deliverers/active');
      return data.deliverers || [];
    } catch (error) {
      console.error('Error fetching active deliverers:', error.message);
      throw error;
    }
  },

  async getCoupons() {
    try {
      const data = await apiClient.get('/coupons');
      return data.coupons || [];
    } catch (error) {
      console.error('Error fetching coupons:', error.message);
      throw error;
    }
  },

  async getActiveCoupons() {
    try {
      const data = await apiClient.get('/coupons/active');
      return data.coupons || [];
    } catch (error) {
      console.error('Error fetching active coupons:', error.message);
      throw error;
    }
  },

  async validateCoupon(couponCode, orderValue = 0) {
    try {
      const data = await apiClient.post('/coupons/validate', { 
        codigo: couponCode,
        valor_pedido: orderValue 
      });
      return data.coupon;
    } catch (error) {
      console.error('Error validating coupon:', error.message);
      throw error;
    }
  }
};
