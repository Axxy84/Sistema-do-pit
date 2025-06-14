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
      console.log(`🔗 [API] Fazendo requisição para: ${endpoint}`);
      console.log(`📍 [API] URL completa: ${url}`);
      console.log(`🔑 [API] Token presente: ${!!token}`);
      
      const response = await fetch(url, config);
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        // Se for erro 401 (Unauthorized), limpar token e redirecionar para login
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          
          // Verificar se estamos numa página que requer autenticação
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
          }
          
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        // Para outros erros, tentar extrair mensagem de erro do body
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse da resposta JSON
      const data = await response.json();
      console.log(`✅ [API] Resposta recebida de: ${endpoint}`);
      
      return data;
      
    } catch (error) {
      console.error(`❌ [API] Erro na requisição para ${endpoint}:`, error.message);
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