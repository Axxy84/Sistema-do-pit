import apiClient from '@/lib/apiClient';

export const dashboardService = {
  // Buscar dados consolidados de fechamento
  async getFechamentoConsolidado(dataInicio, dataFim) {
    try {
      const params = {};
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;

      const response = await apiClient.get('/dashboard/fechamento-consolidado', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados consolidados:', error);
      throw error;
    }
  },

  // Buscar status das mesas em tempo real
  async getMesasTempoReal() {
    try {
      const response = await apiClient.get('/dashboard/mesas-tempo-real');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar status das mesas:', error);
      throw error;
    }
  },

  // Buscar dados gerais do dashboard (função existente preservada)
  async getDashboardData() {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  },

  // Dashboard do Dono - Métricas específicas
  async getOwnerDashboardData(date = new Date().toISOString().split('T')[0]) {
    try {
      // Buscar dados consolidados para a data específica
      const consolidatedData = await this.getFechamentoConsolidado(date, date);
      
      // Buscar despesas do dia
      const expensesResponse = await apiClient.get('/expenses', {
        params: { 
          tipo: 'despesa',
          data_inicio: date,
          data_fim: date
        }
      });

      // Buscar pedidos do dia
      const ordersResponse = await apiClient.get('/orders', {
        params: {
          data_inicio: date,
          data_fim: date,
          status: 'entregue'
        }
      });

      return {
        consolidated: consolidatedData,
        expenses: expensesResponse.data.expenses || [],
        orders: ordersResponse.data.orders || []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard do dono:', error);
      throw error;
    }
  }
}; 