import Booking from '../models/Booking.js';
import Wallet from '../models/Wallet.js';
import { addWalletCredit } from './wallet.js';

export const createBooking = async (userId, tripId, items, total) => {
  const booking = await Booking.create({
    userId,
    tripId,
    items,
    total,
    paymentStatus: 'pending',
  });
  
  return booking;
};

export const cancelBooking = async (bookingId, reason) => {
  const booking = await Booking.findByPk(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.cancelStatus === 'canceled') {
    throw new Error('Booking already canceled');
  }
  
  const cancelFee = Math.round(booking.total * 0.1);
  const refundAmount = booking.total - cancelFee;
  
  // Update booking
  booking.cancelStatus = 'canceled';
  booking.canceledAt = new Date();
  booking.cancelReason = reason;
  
  // Add history event
  booking.history.push({
    event: 'BOOKING_CANCELED',
    cancelFee,
    refundAmount,
    reason,
    timestamp: new Date(),
  });
  
  await booking.save();
  
  // Deduct cancel fee from wallet and refund
  await addWalletCredit(booking.userId, -cancelFee, {
    type: 'CANCEL_FEE',
    bookingId,
  });
  
  // Add refund credit
  await addWalletCredit(booking.userId, refundAmount, {
    type: 'REFUND',
    bookingId,
  });
  
  return booking;
};

export const exchangeBooking = async (bookingId, { toItems, note }) => {
  const booking = await Booking.findByPk(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  const exchangeFee = Math.round(booking.total * 0.05);
  const newTotal = toItems.reduce((sum, item) => sum + item.total, 0);
  const priceDifference = newTotal - booking.total;
  
  // Update booking
  booking.exchanges = booking.exchanges || [];
  booking.exchanges.push({
    oldItems: booking.items,
    oldTotal: booking.total,
    newItems: toItems,
    newTotal,
    exchangeFee,
    priceDifference,
    note,
    timestamp: new Date(),
  });
  
  booking.items = toItems;
  booking.total = newTotal;
  
  booking.history.push({
    event: 'BOOKING_EXCHANGED',
    exchangeFee,
    priceDifference,
    timestamp: new Date(),
  });
  
  await booking.save();
  
  // Deduct exchange fee
  await addWalletCredit(booking.userId, -exchangeFee, {
    type: 'EXCHANGE_FEE',
    bookingId,
  });
  
  // Handle price difference
  if (priceDifference > 0) {
    await addWalletCredit(booking.userId, -priceDifference, {
      type: 'EXCHANGE_PRICE_DIFF',
      bookingId,
    });
  } else if (priceDifference < 0) {
    await addWalletCredit(booking.userId, -priceDifference, {
      type: 'EXCHANGE_REFUND',
      bookingId,
    });
  }
  
  return booking;
};

export const getBookings = async (userId) => {
  return await Booking.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
};

export const getBookingById = async (bookingId) => {
  return await Booking.findByPk(bookingId);
};

export default {
  createBooking,
  cancelBooking,
  exchangeBooking,
  getBookings,
  getBookingById,
};
