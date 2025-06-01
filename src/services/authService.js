import { apiClient } from '@/lib/apiClient';

export const authService = {
  async getSession() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      // Verificar se o token ainda é válido
      const userData = await apiClient.get('/auth/me');
      return {
        user: userData.user,
        access_token: token
      };
    } catch (error) {
      // Token inválido ou expirado
      localStorage.removeItem('authToken');
      localStorage.removeItem('userProfile');
      return null;
    }
  },

  async getUserWithProfile() {
    try {
      const session = await this.getSession();
      if (!session?.user) return { user: null, profile: null };
      
      return { 
        user: session.user, 
        profile: {
          full_name: session.user.full_name,
          role: session.user.role
        }
      };
    } catch (error) {
      console.error("Error in authService.getUserWithProfile:", error);
      return { user: null, profile: null };
    }
  },
  
  onAuthStateChange(callback) {
    // Verificar mudanças no localStorage
    let lastToken = localStorage.getItem('authToken');
    
    const checkAuthState = async () => {
      const currentToken = localStorage.getItem('authToken');
      
      if (lastToken !== currentToken) {
        lastToken = currentToken;
        
        if (currentToken) {
          try {
            const userData = await apiClient.get('/auth/me');
            const session = {
              user: userData.user,
              access_token: currentToken
            };
            callback('SIGNED_IN', session, userData.user, {
              full_name: userData.user.full_name,
              role: userData.user.role
            });
          } catch (error) {
            // Token inválido
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            callback('SIGNED_OUT', null, null, null);
          }
        } else {
          callback('SIGNED_OUT', null, null, null);
        }
      }
    };

    // Verificar inicialmente
    checkAuthState();

    // Verificar mudanças usando storage event (melhor que polling)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        checkAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar a cada 30 segundos para mudanças locais
    const interval = setInterval(checkAuthState, 30000);

    // Retornar função de cleanup
    return {
      subscription: {
        unsubscribe: () => {
          clearInterval(interval);
          window.removeEventListener('storage', handleStorageChange);
        }
      }
    };
  },

  async signInWithPassword(email, password) {
    console.log('🚀 Iniciando login:', { email });
    
    try {
      const response = await apiClient.post('/auth/signin', { email, password });
      
      // Armazenar token
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userProfile', JSON.stringify(response.user));
      
      console.log('✅ Login realizado com sucesso:', response.user);
      
      return { 
        data: {
          session: {
            user: response.user,
            access_token: response.token
          },
          user: response.user
        },
        error: null,
        profile: {
          full_name: response.user.full_name,
          role: response.user.role
        }
      };
    } catch (error) {
      console.error("❌ Erro no login:", error);
      return {
        data: null,
        error: { message: error.message },
        profile: null
      };
    }
  },

  async signUp(email, password, fullName, role) {
    console.log('🚀 Iniciando cadastro:', { email, fullName, role });
    
    try {
      const response = await apiClient.post('/auth/signup', { 
        email, 
        password, 
        fullName, 
        role 
      });
      
      // Armazenar token
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userProfile', JSON.stringify(response.user));
      
      console.log('✅ Cadastro realizado com sucesso:', response.user);
      
      return { 
        data: {
          session: {
            user: response.user,
            access_token: response.token
          },
          user: response.user
        },
        error: null,
        profile: {
          full_name: response.user.full_name,
          role: response.user.role
        }
      };
    } catch (error) {
      console.error("❌ Erro no cadastro:", error);
      return {
        data: null,
        error: { message: error.message },
        profile: null
      };
    }
  },

  async signOut() {
    console.log('🚀 Fazendo logout...');
    
    try {
      // Tentar fazer logout no servidor (opcional)
      try {
        await apiClient.post('/auth/signout');
      } catch (error) {
        // Se der erro no servidor, continuar com logout local
        console.warn('Erro no logout do servidor:', error);
      }
      
      // Limpar dados locais
      localStorage.removeItem('authToken');
      localStorage.removeItem('userProfile');
      
      console.log('✅ Logout realizado com sucesso');
      
      return { error: null };
    } catch (error) {
      console.error("❌ Erro no logout:", error);
      return { error: { message: error.message } };
    }
  },

  async changePassword(currentPassword, newPassword) {
    console.log('🚀 Alterando senha...');
    
    try {
      await apiClient.post('/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
      
      console.log('✅ Senha alterada com sucesso');
      
      return { error: null };
    } catch (error) {
      console.error("❌ Erro ao alterar senha:", error);
      return { error: { message: error.message } };
    }
  },

  // Método utilitário para verificar se está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Método utilitário para obter o token atual
  getToken() {
    return localStorage.getItem('authToken');
  },

  // Método utilitário para obter dados do usuário do localStorage
  getUserFromStorage() {
    try {
      const userProfile = localStorage.getItem('userProfile');
      return userProfile ? JSON.parse(userProfile) : null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário do localStorage:', error);
      return null;
    }
  }
};