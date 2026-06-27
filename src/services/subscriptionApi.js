import { apiClient } from './api.js';

export const subscriptionApi = {
  register(payload) {
    return apiClient.post('/subscriptions', payload);
  },

  renew(id, payload) {
    return apiClient.put(`/subscriptions/${id}/renew`, payload);
  },

  cancel(id, payload) {
    return apiClient.put(`/subscriptions/${id}/cancel`, payload);
  },

  paymentHistory(params = {}) {
    return apiClient.get('/subscriptions/payment-history', { params });
  },
};

export default subscriptionApi;
