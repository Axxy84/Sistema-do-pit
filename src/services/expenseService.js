import { apiClient } from '@/lib/apiClient';

export const expenseService = {
  async getAllExpenses(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      
      const data = await apiClient.get(`/expenses?${params.toString()}`);
      return data.expenses || [];
    } catch (error) {
      console.error('Error fetching expenses:', error.message);
      throw error;
    }
  },

  async getExpenseById(id) {
    try {
      const data = await apiClient.get(`/expenses/${id}`);
      return data.expense;
    } catch (error) {
      console.error('Error fetching expense:', error.message);
      throw error;
    }
  },

  async getExpensesSummary(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      
      const data = await apiClient.get(`/expenses/summary?${params.toString()}`);
      return data.summary || {};
    } catch (error) {
      console.error('Error fetching expenses summary:', error.message);
      throw error;
    }
  },

  async createExpense(expenseData) {
    try {
      const data = await apiClient.post('/expenses', expenseData);
      return data.expense;
    } catch (error) {
      console.error('Error creating expense:', error.message);
      throw error;
    }
  },

  async updateExpense(id, expenseData) {
    try {
      const data = await apiClient.patch(`/expenses/${id}`, expenseData);
      return data.expense;
    } catch (error) {
      console.error('Error updating expense:', error.message);
      throw error;
    }
  },

  async deleteExpense(id) {
    try {
      await apiClient.delete(`/expenses/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting expense:', error.message);
      throw error;
    }
  },

  // Métodos de conveniência
  async getDespesas(filters = {}) {
    return this.getAllExpenses({ ...filters, tipo: 'despesa' });
  },

  async getReceitas(filters = {}) {
    return this.getAllExpenses({ ...filters, tipo: 'receita' });
  },

  async createDespesa(despesaData) {
    return this.createExpense({ ...despesaData, tipo: 'despesa' });
  },

  async createReceita(receitaData) {
    return this.createExpense({ ...receitaData, tipo: 'receita' });
  },

  // Buscar transações (despesas e receitas) de um dia específico
  async fetchDailyTransactions(dateString) {
    try {
      const startDate = dateString;
      const endDate = dateString;
      
      const data = await this.getAllExpenses({
        data_inicio: startDate,
        data_fim: endDate
      });
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching daily transactions:', error.message);
      return { data: [], error: error };
    }
  }
}; 