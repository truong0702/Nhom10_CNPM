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

  /**
   * Login user
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
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

  /**
   * Logout user
   */
  logout() {
    apiClient.setToken(null);
  },
};

export default authApi;
