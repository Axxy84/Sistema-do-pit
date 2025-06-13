import { apiClient } from '@/lib/apiClient';
import { cacheManager } from '@/lib/cacheManager';

export const productService = {

  async getAllActiveProducts() {
    try {
      // Verificar e limpar dados mock antes de buscar produtos reais
      const hasMockData = cacheManager.checkForMockData();
      if (hasMockData.length > 0) {
        console.warn('🚨 Dados mock detectados! Limpando cache...');
        cacheManager.clearAllCache();
      }
      
      const response = await apiClient.request('/products', {
        method: 'GET'
      });
      
      // Validar que todos os produtos têm UUIDs válidos
      const products = response.products || [];
      const validProducts = products.filter(product => {
        const isValidUuid = typeof product.id === 'string' && 
                           product.id.length === 36 && 
                           product.id.includes('-');
        
        if (!isValidUuid) {
          console.warn(`⚠️ Produto com ID inválido ignorado: ${product.nome} (ID: ${product.id})`);
          return false;
        }
        return true;
      });
      
      console.log('✅ [ProductService] Carregados produtos reais do banco:', validProducts.length);
      
      if (validProducts.length !== products.length) {
        console.warn(`⚠️ ${products.length - validProducts.length} produtos com IDs inválidos foram filtrados`);
      }
      
      return validProducts;
    } catch (error) {
      console.error('❌ [ProductService] Erro ao buscar produtos reais:', error.message);
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
