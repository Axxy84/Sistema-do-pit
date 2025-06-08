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
      // TEMPORÁRIO: Dados simulados para evitar travamento
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return this.mockProducts.filter(p => p.ativo);
    } catch (error) {
      console.error('Error fetching active products:', error.message);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      // TEMPORÁRIO: Simular busca por ID
      await new Promise(resolve => setTimeout(resolve, 200));
      const product = this.mockProducts.find(p => p.id == id);
      if (!product) {
        throw new Error('Produto não encontrado');
      }
      return product;
    } catch (error) {
      console.error('Error fetching product:', error.message);
      throw error;
    }
  },

  async createProduct(productData) {
    try {
      // TEMPORÁRIO: Simular criação de produto
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const newProduct = {
        id: Math.max(...this.mockProducts.map(p => p.id)) + 1,
        ...productData,
        ativo: true
      };
      
      this.mockProducts.push(newProduct);
      console.log('[ProductService] Produto criado (simulado):', newProduct);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error.message);
      throw error;
    }
  },

  async updateProduct(id, productData) {
    try {
      // TEMPORÁRIO: Simular atualização de produto
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const productIndex = this.mockProducts.findIndex(p => p.id == id);
      if (productIndex === -1) {
        throw new Error('Produto não encontrado');
      }
      
      const updatedProduct = {
        ...this.mockProducts[productIndex],
        ...productData,
        id: parseInt(id) // Manter ID original
      };
      
      this.mockProducts[productIndex] = updatedProduct;
      console.log('[ProductService] Produto atualizado (simulado):', updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error.message);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      // TEMPORÁRIO: Simular exclusão de produto
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const productIndex = this.mockProducts.findIndex(p => p.id == id);
      if (productIndex === -1) {
        throw new Error('Produto não encontrado');
      }
      
      this.mockProducts.splice(productIndex, 1);
      console.log('[ProductService] Produto deletado (simulado):', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error.message);
      throw error;
    }
  }
};
