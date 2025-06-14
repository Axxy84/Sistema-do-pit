import { apiClient } from '@/lib/apiClient';

export const ownerService = {
  // Verificar se o usuário atual tem acesso de owner
  async verifyOwnerAccess() {
    try {
      // TEMPORÁRIO: Simular verificação de owner
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Por padrão, não é owner - precisa fazer login específico
      return {
        success: false,
        isOwner: false,
        error: 'Autenticação de proprietário necessária.',
        needsOwnerLogin: true
      };
    } catch (error) {
      console.error('Erro ao verificar acesso de owner:', error);
      return {
        success: false,
        isOwner: false,
        error: 'Erro ao verificar acesso.',
        technical: error.message
      };
    }
  },

  async getProfit(startDate, endDate) {
    try {
      const response = await apiClient.get('/owner/profit', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados de lucro:', error);
      throw new Error('Erro ao carregar dados de lucro');
    }
  },

  async getRevenue(startDate, endDate) {
    try {
      const response = await apiClient.get('/owner/revenue', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados de receita:', error);
      throw new Error('Erro ao carregar dados de receita');
    }
  },

  // Buscar dados específicos do dashboard do owner
  async getOwnerDashboard(date = null) {
    try {
      const response = await apiClient.get('/owner/dashboard', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dashboard do owner:', error);
      throw new Error('Erro ao carregar dashboard do owner');
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