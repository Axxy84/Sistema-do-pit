import apiClient from '@/lib/apiClient';

const couponService = {
  // Buscar todos os cupons
  async getAllCoupons() {
    const response = await apiClient.request('/coupons');
    return response.coupons;
  },

  // Buscar cupom por código
  async getByCode(codigo) {
    const response = await apiClient.request('/coupons/code/' + encodeURIComponent(codigo));
    return response.coupon;
  },

  // Buscar cupom por ID
  async getById(id) {
    const response = await apiClient.request(`/coupons/${id}`);
    return response.coupon;
  },

  // Criar novo cupom
  async createCoupon(couponData) {
    const response = await apiClient.request('/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData)
    });
    return response.coupon;
  },

  // Atualizar cupom
  async updateCoupon(id, couponData) {
    const response = await apiClient.request(`/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(couponData)
    });
    return response.coupon;
  },

  // Deletar cupom
  async deleteCoupon(id) {
    const response = await apiClient.request(`/coupons/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

// Named export
export { couponService };

// Default export
export default couponService; 