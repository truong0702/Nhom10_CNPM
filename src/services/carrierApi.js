import { apiClient } from './api.js';

export const carrierApi = {
  async getMe() {
    return apiClient.get('/carrier/me');
  },

  async getTrips() {
    return apiClient.get('/carrier/trips');
  },

  async createTrip(payload) {
    return apiClient.post('/carrier/trips', payload);
  },

  async updateTrip(id, payload) {
    return apiClient.put(`/carrier/trips/${id}`, payload);
  },

  async deleteTrip(id) {
    return apiClient.delete(`/carrier/trips/${id}`);
  },

  async getBookings() {
    return apiClient.get('/carrier/bookings');
  },
};

export default carrierApi;
