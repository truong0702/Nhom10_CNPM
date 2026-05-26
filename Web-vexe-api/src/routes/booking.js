import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  exchangeBooking,
  cancelBooking,
  updateBookingPaymentStatus,
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticateToken);

// Create a new booking
router.post('/', createBooking);

// Get all bookings for current user
router.get('/', getBookings);

// Get a specific booking
router.get('/:id', getBooking);

// Update booking payment status (admin or after payment)
router.put('/:id/status', updateBookingPaymentStatus);

// Cancel a booking
router.post('/:id/cancel', cancelBooking);

// Exchange booking to another trip
router.post('/:id/exchange', exchangeBooking);

export default router;
