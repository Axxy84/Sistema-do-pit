import { apiClient } from '@/lib/apiClient';

export const couponService = {
  async getAllCoupons() {
    try {
      const data = await apiClient.get('/coupons');
      return data.coupons || [];
    } catch (error) {
      console.error('Error fetching coupons:', error.message);
      throw error;
    }
  },

  async getActiveCoupons() {
    try {
      const data = await apiClient.get('/coupons/active');
      return data.coupons || [];
    } catch (error) {
      console.error('Error fetching active coupons:', error.message);
      throw error;
    }
  },

  async getCouponById(id) {
    try {
      const data = await apiClient.get(`/coupons/${id}`);
      return data.coupon;
    } catch (error) {
      console.error('Error fetching coupon:', error.message);
      throw error;
    }
  },

  async validateCoupon(couponCode, orderValue) {
    try {
      const data = await apiClient.post('/coupons/validate', { 
        codigo: couponCode, 
        valorPedido: orderValue 
      });
      return data.coupon;
    } catch (error) {
      console.error('Error validating coupon:', error.message);
      throw error;
    }
  },

  async createCoupon(couponData) {
    try {
      const data = await apiClient.post('/coupons', couponData);
      return data.coupon;
    } catch (error) {
      console.error('Error creating coupon:', error.message);
      throw error;
    }
  },

  async updateCoupon(id, couponData) {
    try {
      const data = await apiClient.patch(`/coupons/${id}`, couponData);
      return data.coupon;
    } catch (error) {
      console.error('Error updating coupon:', error.message);
      throw error;
    }
  },

  async useCoupon(id) {
    try {
      const data = await apiClient.patch(`/coupons/${id}/use`);
      return data.coupon;
    } catch (error) {
      console.error('Error using coupon:', error.message);
      throw error;
    }
  },

  async deleteCoupon(id) {
    try {
      await apiClient.delete(`/coupons/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting coupon:', error.message);
      throw error;
    }
  }
}; 