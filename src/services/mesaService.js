import apiClient from './apiClient';

export const mesaService = {
  // Buscar resumo de uma mesa para fechamento
  async getResumoMesa(numeroMesa) {
    try {
      const response = await apiClient.get(`/orders/mesa/${numeroMesa}/resumo`);
      return response.data;
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
      return response.data;
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      throw error;
    }
  },

  // Listar mesas abertas
  async getMesasAbertas() {
    try {
      const response = await apiClient.get('/orders/mesas/abertas');
      return response.data;
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
        this.getConfiguration('pix_qr_code').catch(() => ({ configuration: null })),
        this.getConfiguration('pix_chave').catch(() => ({ configuration: null })),
        this.getConfiguration('empresa_nome').catch(() => ({ configuration: null }))
      ]);

      return {
        pix_qr_code: pixQrCode.configuration?.valor,
        pix_chave: pixChave.configuration?.valor,
        empresa_nome: empresaNome.configuration?.valor
      };
    } catch (error) {
      console.error('Erro ao buscar configurações PIX:', error);
      throw error;
    }
  }
}; 