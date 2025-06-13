import { apiClient } from '@/lib/apiClient';

export const productService = {
  // TEMPORÁRIO: Dados simulados para evitar travamento
  mockProducts: [
    { 
      id: 1, 
      nome: 'Pizza Margherita', 
      tipo_produto: 'pizza',
      tamanhos_precos: [
        { id_tamanho: 'pequena', nome_tamanho: 'Pequena', preco: 28.90 },
        { id_tamanho: 'media', nome_tamanho: 'Média', preco: 35.90 },
        { id_tamanho: 'grande', nome_tamanho: 'Grande', preco: 42.90 }
      ],
      ingredientes: 'Molho de tomate, mussarela, tomate, manjericão',
      ativo: true
    },
    { 
      id: 2, 
      nome: 'Pizza Pepperoni', 
      tipo_produto: 'pizza',
      tamanhos_precos: [
        { id_tamanho: 'pequena', nome_tamanho: 'Pequena', preco: 32.90 },
        { id_tamanho: 'media', nome_tamanho: 'Média', preco: 39.90 },
        { id_tamanho: 'grande', nome_tamanho: 'Grande', preco: 46.90 }
      ],
      ingredientes: 'Molho de tomate, mussarela, pepperoni',
      ativo: true
    },
    { 
      id: 3, 
      nome: 'Coca-Cola 2L', 
      tipo_produto: 'bebida',
      categoria: 'Refrigerante',
      preco_unitario: 8.50,
      estoque_disponivel: 50,
      ativo: true 
    },
    { 
      id: 4, 
      nome: 'Pizza Calabresa', 
      tipo_produto: 'pizza',
      tamanhos_precos: [
        { id_tamanho: 'pequena', nome_tamanho: 'Pequena', preco: 30.90 },
        { id_tamanho: 'media', nome_tamanho: 'Média', preco: 37.90 },
        { id_tamanho: 'grande', nome_tamanho: 'Grande', preco: 44.90 }
      ],
      ingredientes: 'Molho de tomate, mussarela, calabresa, cebola',
      ativo: true
    },
    { 
      id: 5, 
      nome: 'Água 500ml', 
      tipo_produto: 'bebida',
      categoria: 'Água',
      preco_unitario: 3.00,
      estoque_disponivel: 100,
      ativo: true 
    }
  ],

  async getAllActiveProducts() {
    try {
      const response = await apiClient.request('/products', {
        method: 'GET'
      });
      return response.products || [];
    } catch (error) {
      console.error('Error fetching active products:', error.message);
      // Em caso de erro, retornar dados mockados como fallback
      console.warn('Usando dados mockados como fallback...');
      await new Promise(resolve => setTimeout(resolve, 300));
      return this.mockProducts.filter(p => p.ativo);
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
