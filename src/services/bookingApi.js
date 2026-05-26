// src/services/bookingApi.js
import { apiClient } from './api.js';

export const bookingApi = {
  /**
   * Create new booking
   */
  async createBooking(tripId, items, total) {
    return await apiClient.post('/bookings', {
      tripId,
      items,
      total,
    });
  },

  /**
   * Get all user bookings
   */
  async getMyBookings() {
    return await apiClient.get('/bookings');
  },

  /**
   * Get booking details
   */
  async getBookingById(bookingId) {
    return await apiClient.get(`/bookings/${bookingId}`);
  },

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId, reason) {
    return await apiClient.post(`/bookings/${bookingId}/cancel`, {
      reason,
    });
  },

  /**
   * Exchange booking
   */
  async exchangeBooking(bookingId, toItems, note = '') {
    return await apiClient.post(`/bookings/${bookingId}/exchange`, {
      toItems,
      note,
    });
  },

  /**
   * Update booking payment status
   */
  async updateBookingPaymentStatus(bookingId, status) {
    return await apiClient.put(`/bookings/${bookingId}/status`, {
      status,
    });
  },
};

export default bookingApi;
