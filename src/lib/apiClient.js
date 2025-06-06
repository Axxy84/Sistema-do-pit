// Configuração da API base
const API_BASE_URL = 'http://localhost:3001/api';

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
      const response = await fetch(url, config);
      
      // Verificar se a resposta é JSON válida
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        // Se o erro for de autenticação, limpar token
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          window.location.href = '/login';
        }
        throw new Error(data.error || data.message || `Erro ${response.status}`);
      }

      return data;
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