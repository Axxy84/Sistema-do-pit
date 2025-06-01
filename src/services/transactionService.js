import apiClient from '@/lib/apiClient';

const transactionService = {
  // Buscar todas as transações
  async getAllTransactions(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.tipo) queryParams.append('tipo', filters.tipo);
    if (filters.data_inicio) queryParams.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) queryParams.append('data_fim', filters.data_fim);
    
    const queryString = queryParams.toString();
    const response = await apiClient.request(`/expenses${queryString ? '?' + queryString : ''}`);
    return response.transactions;
  },

  // Buscar transação por ID
  async getById(id) {
    const response = await apiClient.request(`/expenses/${id}`);
    return response.transaction;
  },

  // Criar nova transação
  async createTransaction(transactionData) {
    const response = await apiClient.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
    return response.transaction;
  },

  // Atualizar transação
  async updateTransaction(id, transactionData) {
    const response = await apiClient.request(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(transactionData)
    });
    return response.transaction;
  },

  // Deletar transação
  async deleteTransaction(id) {
    const response = await apiClient.request(`/expenses/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

export default transactionService; 