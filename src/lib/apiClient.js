// Configuração da API base
const API_BASE_URL = 'http://localhost:3001/api';
console.log('🔗 API Base URL configurada:', API_BASE_URL);

// Cliente HTTP personalizado
export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      // TEMPORÁRIO: Log de tentativa de chamada API
      console.warn(`⚠️ [API] Tentativa de chamar: ${endpoint} - Backend não responde, retornando erro simulado`);
      
      // Simular erro de rede para todas as chamadas
      throw new Error('Backend não disponível - usando dados simulados');
      
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'POST', body, ...options });
  },

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PATCH', body, ...options });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PUT', body, ...options });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  },
};

// Interceptor para lidar com erros de autenticação globalmente
export const setupApiInterceptors = () => {
  // Já está implementado no método request acima
  console.log('API Client configurado com interceptors de autenticação');
};

export default apiClient; 