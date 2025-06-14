import { apiClient } from '@/lib/apiClient';

export const orderService = {
  async getAllOrders(filters = {}) {
    try {
      const data = await apiClient.get('/orders', { params: filters });
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
      if (currentOrderDetails?.id) {
        // Atualizar pedido existente
        const updatePayload = {
          ...orderPayload,
          items: itemsData
        };
        const data = await apiClient.patch(`/orders/${currentOrderDetails.id}`, updatePayload);
        return data.order;
      } else {
        // Criar novo pedido
        const createPayload = {
          ...orderPayload,
          items: itemsData
        };
        console.log('[orderService] Criando novo pedido com payload:', JSON.stringify(createPayload, null, 2));
        const data = await apiClient.post('/orders', createPayload);
        return data.order;
      }
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

  async updateOrder(orderId, orderData) {
    try {
      const data = await apiClient.patch(`/orders/${orderId}`, orderData);
      return data.order;
    } catch (error) {
      console.error('Error updating order:', error.message);
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
      console.error('Error updating order status:', error.message);
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

  async validateCoupon(couponCode) {
    try {
      const data = await apiClient.post('/coupons/validate', { 
        codigo: couponCode 
      });
      return data.coupon;
    } catch (error) {
      console.error('Error validating coupon:', error.message);
      throw error;
    }
  },

  // Métodos auxiliares para Mesas
  async getMesaOrders(mesaNumero) {
    try {
      const data = await apiClient.get(`/orders/mesa/${mesaNumero}/resumo`);
      return data;
    } catch (error) {
      console.error(`Error fetching mesa ${mesaNumero} orders:`, error.message);
      throw error;
    }
  },

  async closeMesa(mesaNumero, paymentData) {
    try {
      const data = await apiClient.post(`/orders/mesa/${mesaNumero}/fechar`, paymentData);
      return data;
    } catch (error) {
      console.error(`Error closing mesa ${mesaNumero}:`, error.message);
      throw error;
    }
  },

  async getOpenMesas() {
    try {
      const data = await apiClient.get('/orders/mesas/abertas');
      return data.mesas || [];
    } catch (error) {
      console.error('Error fetching open mesas:', error.message);
      throw error;
    }
  }
};