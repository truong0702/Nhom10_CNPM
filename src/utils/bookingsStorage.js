// src/utils/bookingsStorage.js
import bookingApi from '../services/bookingApi.js';
import adminApi from '../services/adminApi.js';

/**
 * Create a new booking from cart
 */
export const createBookingFromCart = async (userIdOrPayload, tripId, cartItems) => {
  let userId = userIdOrPayload;
  let items = cartItems;
  let paymentMethod;
  if (userIdOrPayload && typeof userIdOrPayload === 'object') {
    const payload = userIdOrPayload;
    userId = payload.userId;
    tripId = payload.tripId || payload.trip?.id || payload.tripId;
    items = payload.items || payload.cartItems || [];
    paymentMethod = payload.paymentMethod;
    // if tripId not provided, try infer from first item id
    if (!tripId) {
      tripId = items && items[0] && (items[0].tripId || items[0].id || items[0].trip?.id)
    }
  }

  if (!Array.isArray(items)) {
    throw new Error('createBookingFromCart: items must be an array');
  }

  const normalizedItems = items.map(item => ({
    id: item.id,
    title: item.title || item.name || '',
    tripId: item.tripId || item.id,
    price: item.price ?? item.amount ?? 0,
    qty: item.qty ?? item.quantity ?? 1,
    seats: item.seats ?? item.selectedSeatLabels?.length ?? item.selectedSeats?.length ?? item.qty ?? item.quantity ?? 1,
    vehicleType: item.vehicleType ?? item.type,
    vehicleVariant: item.vehicleVariant ?? item.variant,
    seatType: item.seatType ?? item.seat_type,
    selectedSeatLabels: item.selectedSeatLabels || item.selectedSeats || [],
    seatPrices: item.seatPrices || [],
    total: item.total ?? item.totalPrice ?? (
      Array.isArray(item.seatPrices) && item.seatPrices.length
        ? item.seatPrices.reduce((sum, price) => sum + Number(price || 0), 0)
        : (item.price ?? item.amount ?? 0) * (item.qty ?? item.quantity ?? 1)
    ),
  }));

  const total = normalizedItems.reduce((sum, it) => sum + it.total, 0);

  try {
    const response = await bookingApi.createBooking(tripId, normalizedItems, total, paymentMethod);
    const b = response?.booking || response?.data || response;
    return normalizeBooking(b);
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw error;
  }
};

/**
 * Get all bookings for a user
 */
export const getBookingsByUser = async (userId) => {
  try {
    const response = await bookingApi.getMyBookings();
    const arr = response.bookings || response.data || [];
    return (arr || []).map(normalizeBooking);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
};

/**
 * Get specific booking by ID
 */
export const getBookingById = async (bookingId) => {
  try {
    const response = await bookingApi.getBookingById(bookingId);
    return normalizeBooking(response.booking || response.data || response);
  } catch (error) {
    console.error('Failed to fetch booking:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId, reason) => {
  try {
    const response = await bookingApi.cancelBooking(bookingId, reason);

    return normalizeBooking(response.booking || response.data || response);
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    throw error;
  }
};

/**
 * Exchange a booking
 */
export const exchangeBooking = async (bookingId, toItems, note = '') => {
  try {
    const response = await bookingApi.exchangeBooking(bookingId, toItems, note);

    return normalizeBooking(response.booking || response.data || response);
  } catch (error) {
    console.error('Failed to exchange booking:', error);
    throw error;
  }
};

/**
 * Update booking payment status
 */
export const updateBookingPaymentStatus = async (bookingId, status) => {
  try {
    const response = await bookingApi.updateBookingPaymentStatus(bookingId, status);
    return normalizeBooking(response.booking || response.data || response);
  } catch (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }
};

/**
 * Normalize booking object returned from various backends/mocks.
 * Ensures `paymentStatus` exists (fallback to `status`), and consistent dates/numbers.
 */
function normalizeBooking(b) {
  if (!b) return b;
  const booking = { ...b };
  // some backends use `status` while frontend expects `paymentStatus`
  if (!booking.paymentStatus && booking.status) booking.paymentStatus = booking.status;
  // ensure numeric total
  if (booking.total) booking.total = Number(booking.total);
  // ensure createdAt exists
  if (!booking.createdAt && booking.created_at) booking.createdAt = booking.created_at;
  return booking;
}

/**
 * Get all bookings for admin (returns all user bookings for now)
 */
export const getAllBookingsForAdmin = async () => {
  try {
    const response = await adminApi.getBookings();
    return response.bookings || [];
  } catch (error) {
    console.error('Failed to fetch bookings for admin:', error);
    return [];
  }
};

/**
 * Get all bookings for a specific user (admin feature)
 */
export const getAllBookingsByUserId = async (userId) => {
  try {
    // This would need a backend endpoint: GET /api/admin/bookings/:userId
    // For now, use regular user booking fetch
    return await getBookingsByUser(userId);
  } catch (error) {
    console.error('Failed to fetch bookings by user:', error);
    return [];
  }
};

export default {
  createBookingFromCart,
  getBookingsByUser,
  getBookingById,
  cancelBooking,
  exchangeBooking,
  updateBookingPaymentStatus,
  getAllBookingsForAdmin,
  getAllBookingsByUserId,
};

