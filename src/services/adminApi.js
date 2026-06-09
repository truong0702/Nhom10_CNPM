import { apiClient } from './api.js';

export const adminApi = {
  async getUsers() {
    return await apiClient.get('/admin/users');
  },

  async updateUser(id, payload) {
    return await apiClient.put(`/admin/users/${id}`, payload);
  },

  async deleteUser(id) {
    return await apiClient.delete(`/admin/users/${id}`);
  },

  async getCarriers() {
    return await apiClient.get('/admin/carriers');
  },

  async createCarrier(payload) {
    return await apiClient.post('/admin/carriers', payload);
  },

  async updateCarrier(id, payload) {
    return await apiClient.put(`/admin/carriers/${id}`, payload);
  },

  async approveCarrier(id) {
    return await apiClient.patch(`/admin/carriers/${id}/approve`);
  },

  async setCarrierStatus(id, status) {
    return await apiClient.patch(`/admin/carriers/${id}/status`, { status });
  },

  async deleteCarrier(id) {
    return await apiClient.delete(`/admin/carriers/${id}`);
  },

  async getTrips() {
    return await apiClient.get('/admin/trips');
  },

  async createTrip(payload) {
    return await apiClient.post('/admin/trips', payload);
  },

  async updateTrip(id, payload) {
    return await apiClient.put(`/admin/trips/${id}`, payload);
  },

  async deleteTrip(id) {
    return await apiClient.delete(`/admin/trips/${id}`);
  },

  async getBookings() {
    return await apiClient.get('/admin/bookings');
  },
};

export default adminApi;
