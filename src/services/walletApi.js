// src/services/walletApi.js
import { apiClient } from './api.js';

export const walletApi = {
  /**
   * Get wallet balance for current user
   */
  async getBalance() {
    try {
      const response = await apiClient.get('/wallet');
      return response.data || response.wallet || response;
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      throw error;
    }
  },

  /**
   * Get wallet transaction history
   */
  async getHistory() {
    try {
      const response = await apiClient.get('/wallet/history');
      return response.data || response.history || [];
    } catch (error) {
      console.error('Failed to fetch wallet history:', error);
      throw error;
    }
  },

  /**
   * Get wallet credit (shorthand)
   */
  async getWalletBalance() {
    return this.getBalance();
  },
};

export default walletApi;
