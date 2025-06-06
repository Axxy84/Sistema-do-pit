import apiClient from '@/lib/apiClient';

const customerService = {
  // Buscar cliente por telefone
  async getByPhone(telefone) {
    console.log('[CustomerService] Buscando cliente por telefone:', telefone);
    try {
      const response = await apiClient.request('/customers/phone/' + encodeURIComponent(telefone));
      console.log('[CustomerService] Cliente encontrado:', response.customer);
      return response.customer;
    } catch (error) {
      // Não fazer log de erro para cliente não encontrado (comportamento normal)
      if (error.message.includes('404') || error.message.includes('não encontrado')) {
        console.log('[CustomerService] Cliente não encontrado (normal para novos clientes)');
      } else {
        console.error('[CustomerService] Erro ao buscar cliente:', error.message);
      }
      throw error;
    }
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
  },

  // Gerenciar cliente (criar ou atualizar)
  async manageCustomer(customerData) {
    console.log('[CustomerService] manageCustomer chamado com:', customerData);
    try {
      let customer;
      const cleanedPhone = customerData.customerPhone ? customerData.customerPhone.replace(/\D/g, '') : '';
      console.log('[CustomerService] Telefone limpo:', cleanedPhone);

      if (customerData.customerId) {
        // Tentar atualizar se já existe um ID
        console.log('[CustomerService] Atualizando cliente existente ID:', customerData.customerId);
        customer = await this.updateCustomer(customerData.customerId, {
          nome: customerData.customerName,
          telefone: cleanedPhone, // Pode estar vazio
          endereco: customerData.customerAddress,
        });
      } else {
        // Se tem telefone, tentar buscar por telefone para evitar duplicados
        if (cleanedPhone && cleanedPhone.length >= 8) {
          console.log('[CustomerService] Tentando buscar cliente por telefone:', cleanedPhone);
          try {
            const existingCustomer = await this.getByPhone(cleanedPhone);
            if (existingCustomer) {
              // Atualizar cliente existente encontrado pelo telefone
              console.log('[CustomerService] Cliente encontrado, atualizando:', existingCustomer.id);
              customer = await this.updateCustomer(existingCustomer.id, {
                nome: customerData.customerName,
                endereco: customerData.customerAddress,
                telefone: cleanedPhone,
              });
            } else {
              // Criar novo se não encontrado pelo telefone
              console.log('[CustomerService] Cliente não encontrado, criando novo');
              customer = await this.createCustomer({
                nome: customerData.customerName,
                telefone: cleanedPhone,
                endereco: customerData.customerAddress,
              });
            }
          } catch (error) {
            // Se getByPhone der erro (ex: 404), significa que não existe, então criar.
            if (error.message.includes('404') || error.message.toLowerCase().includes('não encontrado')) {
              console.log('[CustomerService] Cliente não existe (404), criando novo');
              customer = await this.createCustomer({
                nome: customerData.customerName,
                telefone: cleanedPhone,
                endereco: customerData.customerAddress,
              });
            } else {
              console.error('[CustomerService] Erro inesperado:', error);
              throw error; // Propagar outros erros de getByPhone
            }
          }
        } else {
          // Sem telefone ou telefone muito curto, apenas criar novo cliente
          console.log('[CustomerService] Sem telefone válido, criando cliente sem buscar duplicados');
          customer = await this.createCustomer({
            nome: customerData.customerName,
            telefone: cleanedPhone || null, // Pode ser null/vazio
            endereco: customerData.customerAddress,
          });
        }
      }
      console.log('[CustomerService] Cliente gerenciado com sucesso:', customer);
      return customer.id; // Retornar o ID do cliente gerenciado
    } catch (error) {
      console.error('[CustomerService] Erro em manageCustomer:', error);
      throw new Error(`Falha ao gerenciar cliente: ${error.message}`);
    }
  }
};

export default customerService; 