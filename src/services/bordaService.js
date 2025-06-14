import { apiClient } from '@/lib/apiClient';

export const bordaService = {
  async getAllBordas() {
    try {
      const response = await apiClient.request('/bordas', {
        method: 'GET'
      });
      return response.bordas || [];
    } catch (error) {
      console.error('Erro ao buscar bordas:', error);
      throw error;
    }
  },

  async getBordaById(id) {
    try {
      const response = await apiClient.request(`/bordas/${id}`, {
        method: 'GET'
      });
      return response.borda;
    } catch (error) {
      console.error('Erro ao buscar borda:', error);
      throw error;
    }
  },

  async createBorda(bordaData) {
    try {
      const response = await apiClient.request('/bordas', {
        method: 'POST',
        body: JSON.stringify(bordaData)
      });
      return response.borda;
    } catch (error) {
      console.error('Erro ao criar borda:', error);
      throw error;
    }
  },

  async updateBorda(id, bordaData) {
    try {
      const response = await apiClient.request(`/bordas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bordaData)
      });
      return response.borda;
    } catch (error) {
      console.error('Erro ao atualizar borda:', error);
      throw error;
    }
  },

  async deleteBorda(id) {
    try {
      const response = await apiClient.request(`/bordas/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao deletar borda:', error);
      throw error;
    }
  }
};