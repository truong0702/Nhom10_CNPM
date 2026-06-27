import { apiClient } from './api.js';

export const financeAdminApi = {
  calculateFee(payload) {
    return apiClient.post('/admin/calculate-fee', payload);
  },

  splitPayment(payload) {
    return apiClient.post('/admin/payments/split', payload);
  },

  recordCod(payload) {
    return apiClient.post('/admin/payments/cod', payload);
  },

  reconciliation(params = {}) {
    return apiClient.get('/admin/reconciliation', { params });
  },

  revenueReport(params = {}) {
    return apiClient.get('/admin/revenue-report', { params });
  },
};

export default financeAdminApi;
