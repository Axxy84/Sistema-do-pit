import { apiClient } from '@/lib/apiClient';

export const ownerService = {
  // Verificar se o usuário atual tem acesso de owner
  async verifyOwnerAccess() {
    try {
      const response = await apiClient.get('/owner/verify');
      return {
        success: true,
        isOwner: true,
        user: response.user
      };
    } catch (error) {
      console.error('Erro ao verificar acesso de owner:', error);
      
      // Se o erro for 403 (Forbidden), usuário existe mas não é owner
      if (error.response?.status === 403) {
        return {
          success: false,
          isOwner: false,
          error: 'Acesso negado. Área restrita ao proprietário.',
          userLevel: 'employee'
        };
      }
      
      // Se o erro for 401 (Unauthorized), token inválido ou usuário não logado
      if (error.response?.status === 401) {
        return {
          success: false,
          isOwner: false,
          error: 'Autenticação necessária.',
          needsLogin: true
        };
      }
      
      // Outros erros
      return {
        success: false,
        isOwner: false,
        error: error.response?.data?.error || 'Erro ao verificar acesso.',
        technical: error.message
      };
    }
  },

  // Buscar dados específicos do dashboard do owner
  async getOwnerDashboard(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await apiClient.get('/owner/dashboard', { params });
      return response;
    } catch (error) {
      console.error('Erro ao buscar dashboard do owner:', error);
      throw new Error(error.response?.data?.error || 'Erro ao carregar dashboard do owner');
    }
  },

  // Verificar acesso de owner de forma silenciosa (sem throw)
  async checkOwnerAccessSilent() {
    try {
      const result = await this.verifyOwnerAccess();
      return result.isOwner;
    } catch (error) {
      console.warn('Verificação silenciosa de owner falhou:', error.message);
      return false;
    }
  }
};