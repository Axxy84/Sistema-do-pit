import { apiClient } from '@/lib/apiClient';

export const mesaService = {
  // Buscar resumo de uma mesa para fechamento
  async getResumoMesa(numeroMesa) {
    try {
      const response = await apiClient.get(`/orders/mesa/${numeroMesa}/resumo`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar resumo da mesa:', error);
      throw error;
    }
  },

  // Fechar mesa individualmente (antigo - mantido por compatibilidade)
  async fecharMesa(numeroMesa, observacoes = '') {
    try {
      const response = await apiClient.put(`/orders/mesa/${numeroMesa}/fechar`, {
        observacoes
      });
      return response;
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      throw error;
    }
  },

  // Fechar conta da mesa (novo fluxo)
  async fecharConta(numeroMesa, formaPagamento, observacoes = '') {
    try {
      console.log('🧾 Tentando fechar conta:', { numeroMesa, formaPagamento, observacoes });
      const response = await apiClient.post(`/orders/mesa/${numeroMesa}/fechar-conta`, {
        forma_pagamento: formaPagamento,
        observacoes
      });
      console.log('✅ Conta fechada com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao fechar conta da mesa:', error);
      console.error('   URL tentada:', `/orders/mesa/${numeroMesa}/fechar-conta`);
      console.error('   Tipo de erro:', error.name);
      console.error('   Mensagem:', error.message);
      throw error;
    }
  },

  // Listar mesas abertas
  async getMesasAbertas() {
    try {
      const response = await apiClient.get('/dashboard/mesas-tempo-real');
      return response;
    } catch (error) {
      console.error('Erro ao buscar mesas abertas:', error);
      throw error;
    }
  },

  // Adicionar item a uma mesa
  async adicionarItemMesa(numeroMesa, produto_id, quantidade) {
    try {
      const response = await apiClient.post(`/orders/mesa/${numeroMesa}/adicionar-item`, {
        produto_id,
        quantidade
      });
      return response;
    } catch (error) {
      console.error('Erro ao adicionar item à mesa:', error);
      throw error;
    }
  }
};

export const configurationService = {
  // Buscar todas as configurações
  async getConfigurations() {
    try {
      const response = await apiClient.get('/configurations');
      return response;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
    }
  },

  // Buscar configuração específica
  async getConfiguration(chave) {
    try {
      const response = await apiClient.get(`/configurations/${chave}`);
      return response;
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
      return response;
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
      return response;
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      throw error;
    }
  },

  // Obter configurações PIX
  async getPixConfigurations() {
    try {
      const [pixQrCode, pixChave, empresaNome] = await Promise.all([
        this.getConfiguration('pix_qr_code'),
        this.getConfiguration('pix_chave'),
        this.getConfiguration('empresa_nome')
      ]);

      return {
        pix_qr_code: pixQrCode?.configuration?.valor || null,
        pix_chave: pixChave?.configuration?.valor || null,
        empresa_nome: empresaNome?.configuration?.valor || 'PIT STOP PIZZARIA'
      };
    } catch (error) {
      console.error('Erro ao buscar configurações PIX:', error);
      return {
        pix_qr_code: null,
        pix_chave: null,
        empresa_nome: 'PIT STOP PIZZARIA'
      };
    }
  }
};