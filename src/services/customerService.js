import apiClient from '@/lib/apiClient';

const customerService = {
  // Buscar cliente por telefone
  async getByPhone(telefone) {
    const response = await apiClient.request('/customers/phone/' + encodeURIComponent(telefone));
    return response.customer;
  },

  // Buscar todos os clientes
  async getAllCustomers() {
    const response = await apiClient.request('/customers');
    return response.customers;
  },

  // Buscar cliente por ID
  async getById(id) {
    const response = await apiClient.request(`/customers/${id}`);
    return response.customer;
  },

  // Criar novo cliente
  async createCustomer(customerData) {
    const response = await apiClient.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
    return response.customer;
  },

  // Atualizar cliente
  async updateCustomer(id, customerData) {
    const response = await apiClient.request(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customerData)
    });
    return response.customer;
  },

  // Deletar cliente
  async deleteCustomer(id) {
    const response = await apiClient.request(`/customers/${id}`, {
      method: 'DELETE'
    });
    return response;
  },

  // Buscar pontos do cliente
  async getCustomerPoints(customerId) {
    const response = await apiClient.request(`/customers/${customerId}/points`);
    return response.points;
  }
};

export default customerService; 