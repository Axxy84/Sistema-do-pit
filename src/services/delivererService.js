import apiClient from '@/lib/apiClient';

export const delivererService = {
  // Buscar todos os entregadores
  getAll: async () => {
    const response = await apiClient.get('/deliverers');
    return response.data;
  },
  
  // Buscar todos os entregadores (alias para compatibilidade)
  getAllDeliverers: async () => {
    const response = await apiClient.get('/deliverers');
    return response.data;
  },
  
  // Buscar apenas entregadores ativos
  getActiveDeliverers: async () => {
    const response = await apiClient.get('/deliverers?active=true');
    return response.data;
  },
  
  // Buscar entregador por ID
  getById: async (id) => {
    const response = await apiClient.get(`/deliverers/${id}`);
    return response.data;
  },
  
  // Criar novo entregador
  create: async (data) => {
    const response = await apiClient.post('/deliverers', data);
    return response.data;
  },
  
  // Criar novo entregador (alias para compatibilidade)
  createDeliverer: async (data) => {
    const response = await apiClient.post('/deliverers', data);
    return response.data;
  },
  
  // Atualizar entregador
  update: async (id, data) => {
    const response = await apiClient.patch(`/deliverers/${id}`, data);
    return response.data;
  },
  
  // Atualizar entregador (alias para compatibilidade)
  updateDeliverer: async (id, data) => {
    const response = await apiClient.patch(`/deliverers/${id}`, data);
    return response.data;
  },
  
  // Deletar entregador
  delete: async (id) => {
    const response = await apiClient.delete(`/deliverers/${id}`);
    return response.data;
  },
  
  // Deletar entregador (alias para compatibilidade)
  deleteDeliverer: async (id) => {
    const response = await apiClient.delete(`/deliverers/${id}`);
    return response.data;
  },
  
  // Buscar entregas do entregador
  getDeliveries: async (id) => {
    const response = await apiClient.get(`/deliverers/${id}/deliveries`);
    return response.data;
  }
};

// Export default também para compatibilidade
export default delivererService;
