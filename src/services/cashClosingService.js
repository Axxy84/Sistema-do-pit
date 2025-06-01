import { apiClient } from '@/lib/apiClient';

export const cashClosingService = {
  async getAllCashClosings() {
    try {
      const data = await apiClient.get('/cash-closing');
      return data.cash_closings || [];
    } catch (error) {
      console.error('Error fetching cash closings:', error.message);
      throw error;
    }
  },

  async getCurrentDayData() {
    try {
      const data = await apiClient.get('/cash-closing/current');
      return data || {};
    } catch (error) {
      console.error('Error fetching current day data:', error.message);
      throw error;
    }
  },

  async createCashClosing(closingData) {
    try {
      const data = await apiClient.post('/cash-closing', closingData);
      return data.cash_closing;
    } catch (error) {
      console.error('Error creating cash closing:', error.message);
      throw error;
    }
  },

  async updateCashClosing(id, closingData) {
    try {
      const data = await apiClient.patch(`/cash-closing/${id}`, closingData);
      return data.cash_closing;
    } catch (error) {
      console.error('Error updating cash closing:', error.message);
      throw error;
    }
  },

  async deleteCashClosing(id) {
    try {
      await apiClient.delete(`/cash-closing/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting cash closing:', error.message);
      throw error;
    }
  },

  // Método para fechar o dia com validações
  async closeDay(observacoes = '') {
    try {
      const { cash_closing, already_closed } = await this.getCurrentDayData();
      
      if (already_closed) {
        throw new Error('O caixa já foi fechado hoje');
      }

      return await this.createCashClosing({
        ...cash_closing,
        observacoes
      });
    } catch (error) {
      console.error('Error closing day:', error.message);
      throw error;
    }
  }
}; 