import apiClient from '@/lib/apiClient';

export const dashboardService = {
  // Buscar dados consolidados de fechamento
  async getFechamentoConsolidado(dataInicio, dataFim) {
    try {
      const params = {};
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;

      const response = await apiClient.get('/dashboard/fechamento-consolidado', { params });
      return response;
    } catch (error) {
      console.error('Erro ao buscar dados consolidados:', error);
      throw error;
    }
  },

  // Buscar status das mesas em tempo real
  async getMesasTempoReal() {
    try {
      const response = await apiClient.get('/dashboard/mesas-tempo-real');
      return response;
    } catch (error) {
      console.error('Erro ao buscar status das mesas:', error);
      throw error;
    }
  },

  // Buscar dados gerais do dashboard (função existente preservada)
  async getDashboardData() {
    try {
      const response = await apiClient.get('/dashboard');
      return response;
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }
}; 