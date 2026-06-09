// src/services/authApi.js
import { apiClient } from './api.js';

export const authApi = {
  /**
   * Register new user
   */
  async register(email, password, fullName, phone = '') {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      fullName,
      phone,
    });

    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
    }

    return response;
  },

  async registerCarrier(payload) {
    const response = await apiClient.post('/auth/register-carrier', payload);

    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
    }

    return response;
  },

  /**
   * Login user
   */
  async login(email, password, loginAs = 'user') {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      loginAs,
    });

    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
    }

    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    return await apiClient.get('/auth/profile');
  },

  async updateProfile(payload) {
    return await apiClient.put('/auth/profile', payload);
  },

  async changePassword(oldPassword, newPassword) {
    return await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  },

  async forgotPassword(email) {
    return await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, newPassword) {
    return await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
  },

  /**
   * Logout user
   */
  logout() {
    apiClient.setToken(null);
  },
};

export default authApi;
