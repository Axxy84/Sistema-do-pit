import apiClient from '@/lib/apiClient';

const customerService = {
  // Buscar cliente por telefone
  async getByPhone(telefone) {
    const cleanedPhone = telefone.replace(/\D/g, '');
    console.log('[CustomerService] Buscando cliente por telefone:', cleanedPhone);
    try {
      const response = await apiClient.get(`/customers/phone/${cleanedPhone}`);
      console.log('[CustomerService] Cliente encontrado:', response.customer);
      return response.customer;
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('[CustomerService] Cliente não encontrado (normal para novos clientes)');
      } else {
        console.error('[CustomerService] Erro ao buscar cliente por telefone:', error.message);
      }
      throw error;
    }
  },

  // Buscar todos os clientes
  async getAllCustomers() {
    try {
      const response = await apiClient.get('/customers');
      return response.customers;
    } catch (error) {
      console.error('[CustomerService] Erro ao buscar todos os clientes:', error.message);
      throw error;
    }
  },

  // Buscar cliente por ID
  async getById(id) {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      return response.customer;
    } catch (error) {
      console.error(`[CustomerService] Erro ao buscar cliente por ID ${id}:`, error.message);
      throw error;
    }
  },

  // Criar novo cliente
  async createCustomer(customerData) {
    try {
      const response = await apiClient.post('/customers', customerData);
      console.log('[CustomerService] Cliente criado:', response.customer);
      return response.customer;
    } catch (error) {
      console.error('[CustomerService] Erro ao criar cliente:', error.message);
      throw error;
    }
  },

  // Atualizar cliente
  async updateCustomer(id, customerData) {
    try {
      const response = await apiClient.patch(`/customers/${id}`, customerData);
      console.log('[CustomerService] Cliente atualizado:', response.customer);
      return response.customer;
    } catch (error) {
      console.error(`[CustomerService] Erro ao atualizar cliente ${id}:`, error.message);
      throw error;
    }
  },

  // Deletar cliente
  async deleteCustomer(id) {
    try {
      await apiClient.delete(`/customers/${id}`);
      console.log('[CustomerService] Cliente deletado:', id);
      return { success: true };
    } catch (error) {
      console.error(`[CustomerService] Erro ao deletar cliente ${id}:`, error.message);
      throw error;
    }
  },

  // Buscar pontos do cliente
  async getCustomerPoints(customerId) {
    try {
      const response = await apiClient.get(`/customers/${customerId}/points`);
      return response.points || 0;
    } catch (error) {
      console.error(`[CustomerService] Erro ao buscar pontos do cliente ${customerId}:`, error.message);
      return 0;
    }
  },

  // Gerenciar cliente (criar ou atualizar)
  async manageCustomer(customerData) {
    console.log('[CustomerService] manageCustomer chamado com:', customerData);
    try {
      const response = await apiClient.post('/customers/manage', customerData);
      console.log('[CustomerService] Cliente gerenciado com sucesso:', response.customer);
      return response.customer.id;
    } catch (error) {
      console.error('[CustomerService] Erro em manageCustomer:', error);
      throw new Error(`Falha ao gerenciar cliente: ${error.message}`);
    }
  }
};

export default customerService; 