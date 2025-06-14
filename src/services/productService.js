import { apiClient } from '@/lib/apiClient';
import { cacheManager } from '@/lib/cacheManager';

export const productService = {

  async getAllActiveProducts() {
    try {
      // VERIFICAÇÃO ROBUSTA: Detectar e limpar dados mock automaticamente
      console.log('🔍 [ProductService] Verificando cache antes de buscar produtos...');
      
      const mockDataDetected = cacheManager.checkForMockData();
      if (mockDataDetected.length > 0) {
        console.error('🚨 [ProductService] DADOS MOCK DETECTADOS! Forçando limpeza...');
        console.log('📋 Dados mock encontrados:', mockDataDetected);
        
        // Limpar automaticamente
        cacheManager.clearAllCache();
        
        // Dar um momento para a limpeza ser completada
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('🔗 [ProductService] Fazendo requisição para API...');
      const response = await apiClient.request('/products', {
        method: 'GET'
      });
      
      // Validar resposta da API
      if (!response || !response.products) {
        throw new Error('API retornou resposta inválida');
      }
      
      const products = response.products;
      console.log(`📊 [ProductService] API retornou ${products.length} produtos`);
      
      // VALIDAÇÃO RIGOROSA: Verificar se todos os produtos têm UUIDs válidos
      const validProducts = [];
      const invalidProducts = [];
      
      products.forEach(product => {
        const isValidUuid = product.id && 
                           typeof product.id === 'string' && 
                           product.id.length === 36 && 
                           product.id.includes('-') &&
                           /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);
        
        if (isValidUuid) {
          validProducts.push(product);
        } else {
          invalidProducts.push({
            nome: product.nome,
            id: product.id,
            tipo: typeof product.id,
            length: product.id ? product.id.length : 'undefined'
          });
        }
      });
      
      // Log detalhado dos resultados
      if (invalidProducts.length > 0) {
        console.error('❌ [ProductService] PRODUTOS COM IDs INVÁLIDOS DETECTADOS:');
        invalidProducts.forEach(p => {
          console.error(`   • ${p.nome}: ID="${p.id}" (tipo: ${p.tipo}, length: ${p.length})`);
        });
        
        console.error(`🚨 TOTAL: ${invalidProducts.length} produtos inválidos de ${products.length}`);
        
        // Se mais da metade dos produtos têm IDs inválidos, é provável que seja problema de dados mock
        if (invalidProducts.length > products.length / 2) {
          console.error('🚨 MUITOS IDs INVÁLIDOS - POSSÍVEL PROBLEMA DE CACHE/MOCK!');
          
          // Forçar limpeza total e reload
          cacheManager.forceCleanAndReload();
          return []; // Retornar vazio enquanto recarrega
        }
      }
      
      if (validProducts.length === 0) {
        throw new Error('Nenhum produto válido encontrado. Verifique a API do servidor.');
      }
      
      console.log(`✅ [ProductService] ${validProducts.length} produtos válidos carregados`);
      
      // Log de alguns exemplos para verificação
      if (validProducts.length > 0) {
        console.log('📋 [ProductService] Exemplos de produtos carregados:');
        validProducts.slice(0, 3).forEach(p => {
          console.log(`   • ${p.nome} (ID: ${p.id.slice(0, 8)}..., tipo: ${p.tipo_produto})`);
        });
      }
      
      return validProducts;
      
    } catch (error) {
      console.error('❌ [ProductService] Erro ao buscar produtos:', error);
      
      // Se o erro contém "invalid input syntax for type uuid", é definitivamente problema de dados mock
      if (error.message && error.message.includes('invalid input syntax for type uuid')) {
        console.error('🚨 ERRO UUID DETECTADO - FORÇANDO LIMPEZA TOTAL!');
        cacheManager.forceCleanAndReload();
        return [];
      }
      
      throw new Error('Não foi possível carregar produtos do servidor. Verifique a conexão.');
    }
  },

  async getProductById(id) {
    try {
      const response = await apiClient.request(`/products/${id}`, {
        method: 'GET'
      });
      return response.product;
    } catch (error) {
      console.error('Error fetching product:', error.message);
      throw error;
    }
  },

  async createProduct(productData) {
    try {
      const response = await apiClient.request('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      console.log('[ProductService] Produto criado:', response.product);
      return response.product;
    } catch (error) {
      console.error('Error creating product:', error.message);
      throw error;
    }
  },

  async updateProduct(id, productData) {
    try {
      const response = await apiClient.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      console.log('[ProductService] Produto atualizado:', response.product);
      return response.product;
    } catch (error) {
      console.error('Error updating product:', error.message);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      const response = await apiClient.request(`/products/${id}`, {
        method: 'DELETE'
      });
      console.log('[ProductService] Produto deletado:', id);
      return response;
    } catch (error) {
      console.error('Error deleting product:', error.message);
      throw error;
    }
  }
};
