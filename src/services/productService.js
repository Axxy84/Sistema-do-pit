import { apiClient } from '@/lib/apiClient';

export const productService = {
  async getAllActiveProducts() {
    try {
      const data = await apiClient.get('/products');
      return data.products || [];
    } catch (error) {
      console.error('Error fetching active products:', error.message);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      const data = await apiClient.get(`/products/${id}`);
      return data.product;
    } catch (error) {
      console.error('Error fetching product:', error.message);
      throw error;
    }
  },

  async createProduct(productData) {
    try {
      const data = await apiClient.post('/products', productData);
      return data.product;
    } catch (error) {
      console.error('Error creating product:', error.message);
      throw error;
    }
  },

  async updateProduct(id, productData) {
    try {
      const data = await apiClient.patch(`/products/${id}`, productData);
      return data.product;
    } catch (error) {
      console.error('Error updating product:', error.message);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      await apiClient.delete(`/products/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error.message);
      throw error;
    }
  }
};
