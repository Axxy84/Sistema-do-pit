import apiClient from '@/lib/apiClient';

const customerService = {
  // TEMPORÁRIO: Dados simulados para evitar travamento
  mockCustomers: [
    {
      id: 1,
      nome: 'João Silva',
      telefone: '11999999999',
      email: 'joao@email.com',
      endereco: 'Rua das Flores, 123',
      cep: '01234-567',
      cidade: 'São Paulo',
      pontos_atuais: 85,
      total_pedidos: 12,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      telefone: '11888888888',
      email: 'maria@email.com',
      endereco: 'Av. Principal, 456',
      cep: '01234-890',
      cidade: 'São Paulo',
      pontos_atuais: 142,
      total_pedidos: 23,
      created_at: '2024-02-20T14:15:00Z'
    },
    {
      id: 3,
      nome: 'Pedro Costa',
      telefone: '11777777777',
      email: 'pedro@email.com',
      endereco: 'Praça Central, 789',
      cep: '01234-111',
      cidade: 'São Paulo',
      pontos_atuais: 56,
      total_pedidos: 8,
      created_at: '2024-03-10T09:45:00Z'
    }
  ],

  // Buscar cliente por telefone
  async getByPhone(telefone) {
    console.log('[CustomerService] Buscando cliente por telefone:', telefone);
    try {
      // TEMPORÁRIO: Simular busca nos dados mock
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const cleanedPhone = telefone.replace(/\D/g, '');
      const customer = this.mockCustomers.find(c => c.telefone.replace(/\D/g, '') === cleanedPhone);
      
      if (customer) {
        console.log('[CustomerService] Cliente encontrado:', customer);
        return customer;
      } else {
        console.log('[CustomerService] Cliente não encontrado (normal para novos clientes)');
        throw new Error('Cliente não encontrado');
      }
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
    // TEMPORÁRIO: Retornar dados simulados
    await new Promise(resolve => setTimeout(resolve, 350));
    return this.mockCustomers;
  },

  // Buscar cliente por ID
  async getById(id) {
    // TEMPORÁRIO: Simular busca por ID
    await new Promise(resolve => setTimeout(resolve, 200));
    const customer = this.mockCustomers.find(c => c.id == id);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }
    return customer;
  },

  // Criar novo cliente
  async createCustomer(customerData) {
    // TEMPORÁRIO: Simular criação de cliente
    await new Promise(resolve => setTimeout(resolve, 300));
    const newCustomer = {
      id: Math.max(...this.mockCustomers.map(c => c.id)) + 1,
      nome: customerData.nome,
      telefone: customerData.telefone || '',
      email: customerData.email || '',
      endereco: customerData.endereco || '',
      cep: customerData.cep || '',
      cidade: customerData.cidade || 'São Paulo',
      pontos_atuais: 0,
      total_pedidos: 0,
      created_at: new Date().toISOString()
    };
    this.mockCustomers.push(newCustomer);
    console.log('[CustomerService] Cliente criado (simulado):', newCustomer);
    return newCustomer;
  },

  // Atualizar cliente
  async updateCustomer(id, customerData) {
    // TEMPORÁRIO: Simular atualização de cliente
    await new Promise(resolve => setTimeout(resolve, 250));
    const customerIndex = this.mockCustomers.findIndex(c => c.id == id);
    if (customerIndex === -1) {
      throw new Error('Cliente não encontrado');
    }
    
    const updatedCustomer = {
      ...this.mockCustomers[customerIndex],
      ...customerData,
      id: parseInt(id) // Manter ID original
    };
    this.mockCustomers[customerIndex] = updatedCustomer;
    console.log('[CustomerService] Cliente atualizado (simulado):', updatedCustomer);
    return updatedCustomer;
  },

  // Deletar cliente
  async deleteCustomer(id) {
    // TEMPORÁRIO: Simular exclusão de cliente
    await new Promise(resolve => setTimeout(resolve, 200));
    const customerIndex = this.mockCustomers.findIndex(c => c.id == id);
    if (customerIndex === -1) {
      throw new Error('Cliente não encontrado');
    }
    this.mockCustomers.splice(customerIndex, 1);
    console.log('[CustomerService] Cliente deletado (simulado):', id);
    return { success: true };
  },

  // Buscar pontos do cliente
  async getCustomerPoints(customerId) {
    // TEMPORÁRIO: Simular busca de pontos
    await new Promise(resolve => setTimeout(resolve, 150));
    const customer = this.mockCustomers.find(c => c.id == customerId);
    return customer ? customer.pontos_atuais : 0;
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
            telefone: cleanedPhone || '', // String vazia em vez de null
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