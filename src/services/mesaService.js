import { apiClient } from '@/lib/apiClient';

export const mesaService = {
  // TEMPORÁRIO: Dados simulados
  mockMesas: [
    {
      numero_mesa: 1,
      status: 'aberta',
      total_consumido: 85.90,
      abertura: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
      itens_count: 3,
      cliente: { nome: 'João Silva', telefone: '11999999999' }
    },
    {
      numero_mesa: 3,
      status: 'aberta',
      total_consumido: 125.50,
      abertura: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutos atrás
      itens_count: 5,
      cliente: null
    },
    {
      numero_mesa: 5,
      status: 'aberta',
      total_consumido: 45.00,
      abertura: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutos atrás
      itens_count: 2,
      cliente: { nome: 'Maria Santos', telefone: '11888888888' }
    }
  ],

  // Buscar resumo de uma mesa para fechamento
  async getResumoMesa(numeroMesa) {
    try {
      // TEMPORÁRIO: Simular busca de mesa
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mesa = this.mockMesas.find(m => m.numero_mesa === parseInt(numeroMesa));
      if (!mesa) {
        throw new Error('Mesa não encontrada');
      }
      
      return {
        numero_mesa: mesa.numero_mesa,
        status: mesa.status,
        total: mesa.total_consumido,
        cliente: mesa.cliente,
        abertura: mesa.abertura,
        itens: [
          { nome: 'Pizza Margherita M', quantidade: 1, valor_unitario: 35.90, total: 35.90 },
          { nome: 'Coca-Cola 2L', quantidade: 2, valor_unitario: 8.50, total: 17.00 },
          { nome: 'Pizza Calabresa G', quantidade: 1, valor_unitario: 42.90, total: 42.90 }
        ].slice(0, mesa.itens_count)
      };
    } catch (error) {
      console.error('Erro ao buscar resumo da mesa:', error);
      throw error;
    }
  },

  // Fechar mesa individualmente
  async fecharMesa(numeroMesa, observacoes = '') {
    try {
      // TEMPORÁRIO: Simular fechamento de mesa
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mesaIndex = this.mockMesas.findIndex(m => m.numero_mesa === parseInt(numeroMesa));
      if (mesaIndex === -1) {
        throw new Error('Mesa não encontrada');
      }
      
      // Remover mesa da lista (simular fechamento)
      const mesa = this.mockMesas[mesaIndex];
      this.mockMesas.splice(mesaIndex, 1);
      
      console.log('[MesaService] Mesa fechada (simulado):', numeroMesa);
      return {
        success: true,
        message: `Mesa ${numeroMesa} fechada com sucesso`,
        total: mesa.total_consumido
      };
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      throw error;
    }
  },

  // Listar mesas abertas
  async getMesasAbertas() {
    try {
      // TEMPORÁRIO: Simular busca de mesas abertas
      await new Promise(resolve => setTimeout(resolve, 400));
      
      console.log('[MesaService] Retornando mesas abertas (simulado):', this.mockMesas);
      return {
        mesas: this.mockMesas
      };
    } catch (error) {
      console.error('Erro ao buscar mesas abertas:', error);
      throw error;
    }
  }
};

export const configurationService = {
  // TEMPORÁRIO: Configurações simuladas
  mockConfigurations: {
    pix_qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    pix_chave: '11999999999',
    empresa_nome: 'PIT STOP PIZZARIA'
  },

  // Buscar todas as configurações
  async getConfigurations() {
    try {
      // TEMPORÁRIO: Simular busca de configurações
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return Object.entries(this.mockConfigurations).map(([chave, valor]) => ({
        chave,
        valor,
        descricao: `Configuração ${chave}`,
        tipo: 'texto'
      }));
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
    }
  },

  // Buscar configuração específica
  async getConfiguration(chave) {
    try {
      // TEMPORÁRIO: Simular busca de configuração
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const valor = this.mockConfigurations[chave];
      if (!valor) {
        throw new Error(`Configuração ${chave} não encontrada`);
      }
      
      return {
        configuration: {
          chave,
          valor,
          descricao: `Configuração ${chave}`,
          tipo: 'texto'
        }
      };
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      throw error;
    }
  },

  // Atualizar configuração
  async updateConfiguration(chave, valor, descricao) {
    try {
      // TEMPORÁRIO: Simular atualização
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.mockConfigurations[chave] = valor;
      console.log('[ConfigurationService] Configuração atualizada (simulado):', chave, valor);
      
      return {
        configuration: {
          chave,
          valor,
          descricao: descricao || `Configuração ${chave}`,
          tipo: 'texto'
        }
      };
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  },

  // Criar nova configuração
  async createConfiguration(chave, valor, descricao, tipo = 'texto') {
    try {
      // TEMPORÁRIO: Simular criação
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.mockConfigurations[chave] = valor;
      console.log('[ConfigurationService] Configuração criada (simulado):', chave, valor);
      
      return {
        configuration: {
          chave,
          valor,
          descricao,
          tipo
        }
      };
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      throw error;
    }
  },

  // Obter configurações PIX
  async getPixConfigurations() {
    try {
      // TEMPORÁRIO: Retornar configurações simuladas diretamente
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        pix_qr_code: this.mockConfigurations.pix_qr_code,
        pix_chave: this.mockConfigurations.pix_chave,
        empresa_nome: this.mockConfigurations.empresa_nome
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