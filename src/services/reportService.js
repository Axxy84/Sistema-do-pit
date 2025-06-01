import apiClient from '@/lib/apiClient';

const reportService = {
  // Buscar fechamentos por período
  async getFechamentosPorPeriodo(dataInicio, dataFim) {
    const response = await apiClient.request('/reports/fechamentos', {
      method: 'POST',
      body: JSON.stringify({ data_inicio: dataInicio, data_fim: dataFim })
    });
    return response.fechamentos;
  },

  // Buscar relatório de vendas
  async getSalesReport(startDate, endDate) {
    const response = await apiClient.request('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    });
    return response.report;
  },

  // Buscar relatório de produtos mais vendidos
  async getTopProducts(startDate, endDate, limit = 10) {
    const response = await apiClient.request('/reports/top-products', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate, limit })
    });
    return response.products;
  },

  // Buscar relatório de clientes
  async getCustomersReport(startDate, endDate) {
    const response = await apiClient.request('/reports/customers', {
      method: 'POST', 
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    });
    return response.report;
  }
};

export default reportService; 