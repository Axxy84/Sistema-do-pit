import { apiClient } from '@/lib/apiClient';

export const mesaService = {
  // Buscar resumo de uma mesa para fechamento
  async getResumoMesa(numeroMesa) {
    try {
      const response = await apiClient.get(`/orders/mesa/${numeroMesa}/resumo`);
      console.log('Resposta getResumoMesa:', response);
      // apiClient já retorna os dados diretamente, não em response.data
      return response;
    } catch (error) {
      console.error('Erro ao buscar resumo da mesa:', error);
      throw error;
    }
  },

  // Fechar mesa individualmente
  async fecharMesa(numeroMesa, observacoes = '') {
    try {
      const response = await apiClient.post(`/orders/mesa/${numeroMesa}/fechar`, {
        observacoes
      });
      // apiClient já retorna os dados diretamente, não em response.data
      return response;
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      throw error;
    }
  },

  // Listar mesas abertas
  async getMesasAbertas() {
    try {
      const response = await apiClient.get('/orders/mesas/abertas');
      console.log('Resposta do apiClient.get:', response);
      return response;
    } catch (error) {
      console.error('Erro ao buscar mesas abertas:', error);
      throw error;
    }
  }
};

export const configurationService = {
  // Buscar todas as configurações
  async getConfigurations() {
    try {
      const response = await apiClient.get('/configurations');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
    }
  },

  // Buscar configuração específica
  async getConfiguration(chave) {
    try {
      const response = await apiClient.get(`/configurations/${chave}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      throw error;
    }
  },

  // Atualizar configuração
  async updateConfiguration(chave, valor, descricao) {
    try {
      const response = await apiClient.put(`/configurations/${chave}`, {
        valor,
        descricao
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  },

  // Criar nova configuração
  async createConfiguration(chave, valor, descricao, tipo = 'texto') {
    try {
      const response = await apiClient.post('/configurations', {
        chave,
        valor,
        descricao,
        tipo
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      throw error;
    }
  },

  // Obter configurações PIX
  async getPixConfigurations() {
    try {
      const [pixQrCode, pixChave, empresaNome] = await Promise.all([
        this.getConfiguration('pix_qr_code').catch(() => null),
        this.getConfiguration('pix_chave').catch(() => null),
        this.getConfiguration('empresa_nome').catch(() => null)
      ]);

      return {
        pix_qr_code: pixQrCode?.configuration?.valor || null,
        pix_chave: pixChave?.configuration?.valor || null,
        empresa_nome: empresaNome?.configuration?.valor || null
      };
    } catch (error) {
      console.error('Erro ao buscar configurações PIX:', error);
      return {
        pix_qr_code: null,
        pix_chave: null,
        empresa_nome: null
      };
    }
  }
}; 