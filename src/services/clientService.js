import { apiClient } from '@/lib/apiClient';

export const clientService = {
  async getAllClients() {
    try {
      // TEMPORÁRIO: Dados simulados para evitar travamento
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const mockClients = [
        {
          id: 1,
          nome: 'João Silva',
          telefone: '11999999999',
          email: 'joao@email.com',
          endereco: 'Rua das Flores, 123',
          cep: '01234-567',
          cidade: 'São Paulo',
          pontos: 85,
          total_pedidos: 12,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          nome: 'Maria Santos',
          telefone: '11888888888',
          email: 'maria@email.com',
          endereco: 'Av. Principal, 456',
          cep: '01234-890',
          cidade: 'São Paulo',
          pontos: 142,
          total_pedidos: 23,
          created_at: '2024-02-20T14:15:00Z'
        },
        {
          id: 3,
          nome: 'Pedro Costa',
          telefone: '11777777777',
          email: 'pedro@email.com',
          endereco: 'Praça Central, 789',
          cep: '01234-111',
          cidade: 'São Paulo',
          pontos: 56,
          total_pedidos: 8,
          created_at: '2024-03-10T09:45:00Z'
        }
      ];
      
      return mockClients;
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