import { apiClient } from '@/lib/apiClient';

export const orderService = {
  async getAllOrders(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
      
      const data = await apiClient.get(`/orders?${params.toString()}`);
      return data.orders || [];
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
      // Preparar dados para o backend
      const fullOrderData = {
        ...orderPayload,
        items: itemsData
      };

      let savedOrder;
      if (currentOrderDetails?.id) {
        // Atualizar pedido existente (se implementado no backend)
        savedOrder = await apiClient.patch(`/orders/${currentOrderDetails.id}`, fullOrderData);
      } else {
        // Criar novo pedido
        savedOrder = await apiClient.post('/orders', fullOrderData);
      }

      return savedOrder.order;
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
      const data = await apiClient.patch(`/orders/${orderId}/status`, { 
        status_pedido: newStatus 
      });
      return data.order;
    } catch (error) {
      console.error(`Error updating status for order ${orderId}:`, error.message);
      throw error;
    }
  },

  async deleteOrder(orderId) {
    try {
      await apiClient.delete(`/orders/${orderId}`);
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
