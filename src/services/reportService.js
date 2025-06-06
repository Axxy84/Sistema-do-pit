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

  // Buscar produtos mais vendidos
  async getTopProducts(startDate, endDate, limit = 10, tipoPedido = null) {
    const body = { start_date: startDate, end_date: endDate, limit };
    if (tipoPedido) {
      body.tipo_pedido = tipoPedido;
    }
    
    const response = await apiClient.request('/reports/top-products', {
      method: 'POST',
      body: JSON.stringify(body)
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
  },

  // Novo: Relatório comparativo mesa vs delivery
  async getComparativeReport(startDate, endDate) {
    const response = await apiClient.request('/reports/comparative', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    });
    return response.report;
  },

  // Novo: Vendas por tipo de pedido
  async getSalesByType(startDate, endDate, tipoPedido = null) {
    const body = { start_date: startDate, end_date: endDate };
    if (tipoPedido) {
      body.tipo_pedido = tipoPedido;
    }
    
    const response = await apiClient.request('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return response.report;
  },

  // Novo: Top produtos por tipo de pedido específico
  async getTopProductsByType(startDate, endDate, tipoPedido, limit = 10) {
    const response = await apiClient.request('/reports/top-products', {
      method: 'POST',
      body: JSON.stringify({ 
        start_date: startDate, 
        end_date: endDate, 
        tipo_pedido: tipoPedido,
        limit 
      })
    });
    return response.products;
  }
};

export default reportService; 