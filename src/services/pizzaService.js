import apiClient from '@/lib/apiClient';

export const pizzaService = {
  // Buscar todas as pizzas
  getAll: async () => {
    const response = await apiClient.get('/api/pizzas');
    return response.data;
  },
  
  // Buscar pizza por ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/pizzas/${id}`);
    return response.data;
  },
  
  // Criar nova pizza
  create: async (data) => {
    const response = await apiClient.post('/api/pizzas', data);
    return response.data;
  },
  
  // Atualizar pizza
  update: async (id, data) => {
    const response = await apiClient.patch(`/api/pizzas/${id}`, data);
    return response.data;
  },
  
  // Deletar pizza
  delete: async (id) => {
    const response = await apiClient.delete(`/api/pizzas/${id}`);
    return response.data;
  }
};

// Export default também para compatibilidade
export default pizzaService; 