// src/services/paymentApi.js
import { apiClient } from './api.js';

export const paymentApi = {
  /**
   * Get bank account information
   */
  async getBankInfo() {
    return await apiClient.get('/payments/bank-info');
  },

  /**
   * Create bank transfer payment
   */
  async createBankTransferPayment(bookingId, amount, bankTransferNote = '') {
    return await apiClient.post('/payments/bank-transfer', {
      bookingId,
      amount,
      bankTransferNote,
    });
  },

  /**
   * Create VNPay payment URL
   */
  async createVnpayPayment(bookingId, amount) {
    return await apiClient.post('/payments/vnpay', {
      bookingId,
      amount,
    });
  },

  /**
   * Verify VNPay return query
   */
  async verifyVnpayReturn(params) {
    return await apiClient.get('/payments/vnpay/return', { params });
  },

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId) {
    return await apiClient.get(`/payments/${paymentId}`);
  },

  /**
   * Admin: Get pending bank transfers
   */
  async getPendingBankTransfers() {
    return await apiClient.get('/payments/admin/pending');
  },

  /**
   * Admin: Get all payments
   */
  async getAllPayments(status = null, method = null) {
    const params = {};
    if (status) params.status = status;
    if (method) params.method = method;
    return await apiClient.get('/payments/admin/all', { params });
  },

  /**
   * Admin: Verify bank transfer
   */
  async verifyBankTransfer(paymentId, data) {
    return await apiClient.post(`/payments/admin/${paymentId}/verify`, data);
  },

  /**
   * Admin: Reject bank transfer
   */
  async rejectBankTransfer(paymentId, reason) {
    return await apiClient.post(`/payments/admin/${paymentId}/reject`, {
      reason,
    });
  },
};

export default paymentApi;
