import { apiClient } from '@/lib/apiClient';

export const clientService = {
  async getAllClients() {
    try {
      const data = await apiClient.get('/clients');
      return data.clients || [];
    } catch (error) {
      console.error('Error fetching clients:', error.message);
      throw error;
    }
  },

  async getClientById(id) {
    try {
      const data = await apiClient.get(`/clients/${id}`);
      return data.client;
    } catch (error) {
      console.error('Error fetching client:', error.message);
      throw error;
    }
  },

  async getClientPoints(id) {
    try {
      const data = await apiClient.get(`/clients/${id}/points`);
      return data.points || 0;
    } catch (error) {
      console.error('Error fetching client points:', error.message);
      throw error;
    }
  },

  async createClient(clientData) {
    try {
      const data = await apiClient.post('/clients', clientData);
      return data.client;
    } catch (error) {
      console.error('Error creating client:', error.message);
      throw error;
    }
  },

  async updateClient(id, clientData) {
    try {
      const data = await apiClient.patch(`/clients/${id}`, clientData);
      return data.client;
    } catch (error) {
      console.error('Error updating client:', error.message);
      throw error;
    }
  },

  async deleteClient(id) {
    try {
      await apiClient.delete(`/clients/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error.message);
      throw error;
    }
  }
}; 