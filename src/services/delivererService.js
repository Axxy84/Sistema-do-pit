import { apiClient } from '@/lib/apiClient';

export const delivererService = {
  async getAllDeliverers() {
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

  async getDelivererById(id) {
    try {
      const data = await apiClient.get(`/deliverers/${id}`);
      return data.deliverer;
    } catch (error) {
      console.error('Error fetching deliverer:', error.message);
      throw error;
    }
  },

  async createDeliverer(delivererData) {
    try {
      const data = await apiClient.post('/deliverers', delivererData);
      return data.deliverer;
    } catch (error) {
      console.error('Error creating deliverer:', error.message);
      throw error;
    }
  },

  async updateDeliverer(id, delivererData) {
    try {
      const data = await apiClient.patch(`/deliverers/${id}`, delivererData);
      return data.deliverer;
    } catch (error) {
      console.error('Error updating deliverer:', error.message);
      throw error;
    }
  },

  async deleteDeliverer(id) {
    try {
      await apiClient.delete(`/deliverers/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting deliverer:', error.message);
      throw error;
    }
  }
};
