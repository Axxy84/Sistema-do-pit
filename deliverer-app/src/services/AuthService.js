import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

class AuthService {
  constructor() {
    this.token = null;
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Interceptor para adicionar token automaticamente
    axios.interceptors.request.use(
      async (config) => {
        const token = this.token || await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar respostas 401 (token expirado)
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  async login(telefone, senha) {
    try {
      const response = await axios.post(`${API_BASE_URL}/deliverer-app/auth/login`, {
        telefone,
        senha
      });

      if (response.data.success) {
        this.token = response.data.token;
        await this.storeToken(response.data.token);
        await this.storeDelivererData(response.data.entregador);
        
        return {
          success: true,
          entregador: response.data.entregador,
          token: response.data.token
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Erro no login'
        };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro de conexão';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async validateToken(token) {
    try {
      const response = await axios.get(`${API_BASE_URL}/deliverer-app/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.token = token;
        return {
          success: true,
          entregador: response.data.entregador
        };
      } else {
        await this.logout();
        return null;
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      await this.logout();
      return null;
    }
  }

  async logout() {
    try {
      this.token = null;
      await SecureStore.deleteItemAsync('deliverer_token');
      await SecureStore.deleteItemAsync('deliverer_data');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }

  async storeToken(token) {
    try {
      await SecureStore.setItemAsync('deliverer_token', token);
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  }

  async getStoredToken() {
    try {
      return await SecureStore.getItemAsync('deliverer_token');
    } catch (error) {
      console.error('Erro ao recuperar token:', error);
      return null;
    }
  }

  async storeDelivererData(delivererData) {
    try {
      await SecureStore.setItemAsync('deliverer_data', JSON.stringify(delivererData));
    } catch (error) {
      console.error('Erro ao salvar dados do entregador:', error);
    }
  }

  async getStoredDelivererData() {
    try {
      const data = await SecureStore.getItemAsync('deliverer_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao recuperar dados do entregador:', error);
      return null;
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export const AuthService = new AuthService();