import { apiClient } from './api.js';

export const vehicleApi = {
  async getCategories() {
    return await apiClient.get('/carrier/vehicles/categories');
  },

  async list() {
    return await apiClient.get('/carrier/vehicles');
  },

  async create(payload) {
    return await apiClient.post('/carrier/vehicles', payload);
  },

  async update(id, payload) {
    return await apiClient.put(`/carrier/vehicles/${id}`, payload);
  },

  async delete(id) {
    return await apiClient.delete(`/carrier/vehicles/${id}`);
  },
};

export default vehicleApi;
