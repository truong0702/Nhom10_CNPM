import { Op } from 'sequelize';
import { Booking, Payment, Trip } from '../models/index.js';

const DEFAULT_HOLD_MINUTES = 15;

export const getBookingHoldMinutes = () => {
  const value = Number(process.env.BOOKING_HOLD_MINUTES || DEFAULT_HOLD_MINUTES);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HOLD_MINUTES;
};

const getSeatCount = (items) => {
  if (!Array.isArray(items)) return 1;
  return items.reduce((sum, item) => {
    const selectedSeats = item.selectedSeatLabels || item.selectedSeats || [];
    return sum + Number(item.seats || selectedSeats.length || item.qty || 1);
  }, 0);
};

const markPendingPaymentsFailed = async (bookingId) => {
  const payments = await Payment.findAll({
    where: {
      bookingId,
      status: 'pending',
    },
  });

  await Promise.all(payments.map((payment) => {
    payment.status = 'failed';
    payment.verifiedAt = new Date();
    payment.verificationNote = 'Booking hold expired before payment was completed';
    return payment.save();
  }));
};

export const expirePendingBookings = async ({ tripId, userId } = {}) => {
  const holdMinutes = getBookingHoldMinutes();
  const cutoff = new Date(Date.now() - holdMinutes * 60 * 1000);
  const where = {
    cancelStatus: 'active',
    paymentStatus: 'pending',
    createdAt: { [Op.lt]: cutoff },
  };

  if (tripId) where.tripId = tripId;
  if (userId) where.userId = userId;

  const expiredBookings = await Booking.findAll({ where });

  for (const booking of expiredBookings) {
    const seatsToRelease = getSeatCount(booking.items);
    const trip = await Trip.findByPk(booking.tripId);

    booking.paymentStatus = 'failed';
    booking.cancelStatus = 'canceled';
    booking.canceledAt = new Date();
    booking.cancelReason = `Booking hold expired after ${holdMinutes} minutes`;
    if (!booking.history) booking.history = [];
    booking.history.push({
      event: 'BOOKING_HOLD_EXPIRED',
      holdMinutes,
      releasedSeats: seatsToRelease,
      timestamp: new Date(),
    });
    await booking.save();

    if (trip) {
      trip.seatsAvailable = Math.min(
        Number(trip.seats || 0),
        Number(trip.seatsAvailable || 0) + seatsToRelease
      );
      await trip.save();
    }

    await markPendingPaymentsFailed(booking.id);
  }

  return expiredBookings.length;
};

export const isBookingExpired = (booking) => (
  booking?.cancelStatus === 'canceled' &&
  booking?.cancelReason &&
  String(booking.cancelReason).includes('Booking hold expired')
);
