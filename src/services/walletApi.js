// src/services/walletApi.js
import { apiClient } from './api.js';

export const walletApi = {
  /**
   * Get wallet balance for current user
   */
  async getBalance() {
    try {
      // This returns wallet info from profile
      const response = await apiClient.get('/auth/profile');
      return response.wallet;
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
      // This endpoint should be added to backend if needed
      // For now, we'll rely on booking details which include transaction info
      const response = await apiClient.get('/bookings');
      return response.wallet?.history || [];
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
