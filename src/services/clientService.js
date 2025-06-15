// Cliente Service - Usando rotas corretas /customers
// Última atualização: 14/06/2025 - Corrigido para usar /customers em vez de /clients
import apiClient from '@/lib/apiClient';

export const clientService = {
  async getAllClients() {
    try {
      const response = await apiClient.get('/customers');
      return response.customers || [];
    } catch (error) {
      console.error('Error fetching clients:', error.message);
      throw error;
    }
  },

  async getClientById(id) {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      return response.customer;
    } catch (error) {
      console.error('Error fetching client:', error.message);
      throw error;
    }
  },

  async getClientPoints(id) {
    try {
      const response = await apiClient.get(`/customers/${id}/points`);
      return response.points || 0;
    } catch (error) {
      console.error('Error fetching client points:', error.message);
      throw error;
    }
  },

  async createClient(clientData) {
    try {
      const response = await apiClient.post('/customers', clientData);
      return response.customer;
    } catch (error) {
      console.error('Error creating client:', error.message);
      throw error;
    }
  },

  async updateClient(id, clientData) {
    try {
      const response = await apiClient.patch(`/customers/${id}`, clientData);
      return response.customer;
    } catch (error) {
      console.error('Error updating client:', error.message);
      throw error;
    }
  },

  async deleteClient(id) {
    try {
      console.log(`[ClientService] Deletando cliente ID: ${id}`);
      console.log(`[ClientService] URL: /customers/${id}`);
      await apiClient.delete(`/customers/${id}`);
      console.log(`[ClientService] Cliente ${id} deletado com sucesso`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error.message);
      console.error('URL tentada:', `/customers/${id}`);
      throw error;
    }
  }
}; 