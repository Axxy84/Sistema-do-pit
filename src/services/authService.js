import { apiClient } from '@/lib/apiClient';

export const authService = {
  async getSession() {
    try {
      const token = localStorage.getItem('authToken');
      const userProfile = localStorage.getItem('userProfile');
      
      if (!token || !userProfile) return null;

      // Retornar dados do localStorage sem validar no servidor
      // A validação será feita apenas quando necessário
      const user = JSON.parse(userProfile);
      return {
        user: user,
        access_token: token
      };
    } catch (error) {
      // Se houver erro ao ler localStorage, limpar dados
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
    // Versão simplificada que apenas monitora mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
          const userProfile = localStorage.getItem('userProfile');
          if (userProfile) {
            try {
              const user = JSON.parse(userProfile);
              callback('SIGNED_IN', { user, access_token: currentToken }, user, {
                full_name: user.full_name,
                role: user.role
              });
            } catch (error) {
              callback('SIGNED_OUT', null, null, null);
            }
          }
        } else {
          callback('SIGNED_OUT', null, null, null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return {
      subscription: {
        unsubscribe: () => {
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