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

  // Buscar dados específicos do dashboard do owner
  async getOwnerDashboard(date = null) {
    try {
      // TEMPORÁRIO: Simular dados do dashboard owner
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        revenue: {
          total: 15234.56,
          today: 1234.56,
          week: 8500.00,
          month: 15234.56
        },
        expenses: {
          total: 3200.00,
          today: 150.00,
          week: 1000.00,
          month: 3200.00
        },
        profit: {
          total: 12034.56,
          margin: 79
        },
        metrics: {
          averageTicket: 45.50,
          ordersCount: 335,
          customersCount: 205
        }
      };
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