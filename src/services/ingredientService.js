import { apiClient } from '@/lib/apiClient';

export const ingredientService = {
  async getAllIngredients() {
    try {
      const data = await apiClient.get('/ingredients');
      return data.ingredients || [];
    } catch (error) {
      console.error('Error fetching ingredients:', error.message);
      throw error;
    }
  },

  async getIngredientById(id) {
    try {
      const data = await apiClient.get(`/ingredients/${id}`);
      return data.ingredient;
    } catch (error) {
      console.error('Error fetching ingredient:', error.message);
      throw error;
    }
  },

  async getLowStockReport() {
    try {
      const data = await apiClient.get('/ingredients/reports/low-stock');
      return data.ingredients || [];
    } catch (error) {
      console.error('Error fetching low stock report:', error.message);
      throw error;
    }
  },

  async createIngredient(ingredientData) {
    try {
      const data = await apiClient.post('/ingredients', ingredientData);
      return data.ingredient;
    } catch (error) {
      console.error('Error creating ingredient:', error.message);
      throw error;
    }
  },

  async updateIngredient(id, ingredientData) {
    try {
      const data = await apiClient.patch(`/ingredients/${id}`, ingredientData);
      return data.ingredient;
    } catch (error) {
      console.error('Error updating ingredient:', error.message);
      throw error;
    }
  },

  async updateIngredientStock(id, stockData) {
    try {
      const data = await apiClient.patch(`/ingredients/${id}/stock`, stockData);
      return data.ingredient;
    } catch (error) {
      console.error('Error updating ingredient stock:', error.message);
      throw error;
    }
  },

  async deleteIngredient(id) {
    try {
      await apiClient.delete(`/ingredients/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting ingredient:', error.message);
      throw error;
    }
  }
}; 