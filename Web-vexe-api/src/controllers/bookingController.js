import { Booking, Trip, User, Wallet } from '../models/index.js';

// Helper functions
const getWalletBalance = async (userId) => {
  let wallet = await Wallet.findOne({ where: { userId } });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, currency: 'VND' });
  }
  return wallet;
};

const addWalletCredit = async (userId, amount, description = {}) => {
  const wallet = await getWalletBalance(userId);
  wallet.balance += amount;
  if (!wallet.history) wallet.history = [];
  wallet.history.push({
    type: description.type || 'OTHER',
    amount,
    description: description.description || 'Transaction',
    bookingId: description.bookingId || null,
    timestamp: new Date(),
  });
  await wallet.save();
  return wallet;
};

// CREATE BOOKING - Accept items and total from frontend
export const createBooking = async (req, res) => {
  try {
    const { tripId, items, total } = req.body;
    const userId = req.user.id;

    // Validate trip exists
    const trip = await Trip.findByPk(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Calculate total seats from items
    let totalSeats = 0;
    if (Array.isArray(items)) {
      items.forEach(item => {
        totalSeats += item.seats || 1;
      });
    } else {
      totalSeats = 1;
    }

    // Validate seats available
    if (trip.seatsAvailable < totalSeats) {
      return res.status(400).json({
        error: 'Not enough seats available',
        available: trip.seatsAvailable,
        requested: totalSeats,
      });
    }

    // Prepare items
    const bookingItems = Array.isArray(items) ? items : [
      {
        description: `${trip.from} -> ${trip.to}`,
        seats: totalSeats,
        price: trip.price,
        total: total || trip.price * totalSeats,
      }
    ];

    // Create booking
    const booking = await Booking.create({
      userId,
      tripId,
      items: bookingItems,
      total: total || trip.price * totalSeats,
      paymentStatus: 'pending',
      cancelStatus: 'active',
    });

    // Deduct seats from trip
    trip.seatsAvailable -= totalSeats;
    await trip.save();

    // Add to history
    if (!booking.history) booking.history = [];
    booking.history.push({
      event: 'BOOKING_CREATED',
      timestamp: new Date(),
      seats: totalSeats,
      total: booking.total,
    });
    await booking.save();

    return res.status(201).json({
      message: 'Booking created successfully',
      booking,
      trip: {
        id: trip.id,
        seatsRemaining: trip.seatsAvailable,
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message });
  }
};

// EXCHANGE BOOKING - Accept toItems and note from frontend
export const exchangeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { toItems, note } = req.body;
    const userId = req.user.id;

    // Get current booking
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Verify ownership
    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: Cannot exchange this booking' });
    }

    // Check if already canceled
    if (booking.cancelStatus === 'canceled') {
      return res.status(400).json({ error: 'Cannot exchange a canceled booking' });
    }

    // Extract new trip info from toItems
    const newTripId = toItems?.tripId;
    const exchangeSeats = toItems?.seats || booking.items[0]?.seats || 1;

    if (!newTripId) {
      return res.status(400).json({ error: 'New trip ID is required (toItems.tripId)' });
    }

    // Get new and old trips
    const newTrip = await Trip.findByPk(newTripId);
    if (!newTrip) return res.status(404).json({ error: 'New trip not found' });

    const oldTrip = await Trip.findByPk(booking.tripId);

    // Validate seats available
    if (newTrip.seatsAvailable < exchangeSeats) {
      return res.status(400).json({
        error: 'Not enough seats in new trip',
        available: newTrip.seatsAvailable,
        requested: exchangeSeats,
      });
    }

    // Calculate price difference
    const oldTotal = booking.total;
    const newTotal = newTrip.price * exchangeSeats;
    const priceDifference = newTotal - oldTotal;

    // Calculate exchange fee (5%)
    let exchangeFee = 0;
    if (priceDifference > 0) {
      exchangeFee = Math.ceil(priceDifference * 0.05);
    }

    // Track exchange in history
    if (!booking.exchanges) booking.exchanges = [];
    booking.exchanges.push({
      from: {
        tripId: oldTrip?.id,
        route: `${oldTrip?.from} -> ${oldTrip?.to}`,
        seats: booking.items[0]?.seats,
      },
      to: {
        tripId: newTripId,
        route: `${newTrip.from} -> ${newTrip.to}`,
        seats: exchangeSeats,
      },
      oldTotal,
      newTotal,
      priceDifference,
      exchangeFee,
      reason: note || 'No reason provided',
      timestamp: new Date(),
    });

    // Update booking
    booking.tripId = newTripId;
    booking.items = [
      {
        description: `${newTrip.from} -> ${newTrip.to}`,
        seats: exchangeSeats,
        price: newTrip.price,
        total: newTotal,
      }
    ];
    booking.total = newTotal;

    if (!booking.history) booking.history = [];
    booking.history.push({
      event: 'BOOKING_EXCHANGED',
      oldTrip: booking.tripId,
      newTrip: newTripId,
      priceDifference,
      exchangeFee,
      timestamp: new Date(),
    });

    await booking.save();

    // Update seat counts
    if (oldTrip) {
      oldTrip.seatsAvailable += booking.items[0]?.seats || 0;
      await oldTrip.save();
    }
    newTrip.seatsAvailable -= exchangeSeats;
    await newTrip.save();

    // Update wallet for fees
    if (exchangeFee > 0) {
      await addWalletCredit(userId, -exchangeFee, {
        type: 'EXCHANGE_FEE',
        description: 'Exchange fee',
        bookingId: id,
      });
    }

    if (priceDifference > 0) {
      await addWalletCredit(userId, -priceDifference, {
        type: 'EXCHANGE_ADDITIONAL_CHARGE',
        description: 'Additional charge for exchange',
        bookingId: id,
      });
    } else if (priceDifference < 0) {
      await addWalletCredit(userId, Math.abs(priceDifference), {
        type: 'EXCHANGE_REFUND',
        description: 'Refund from exchange',
        bookingId: id,
      });
    }

    const updatedWallet = await getWalletBalance(userId);

    return res.json({
      message: 'Booking exchanged successfully',
      booking,
      exchange: {
        priceDifference,
        exchangeFee,
        totalCharge: exchangeFee + Math.max(priceDifference, 0),
      },
      wallet: {
        newBalance: updatedWallet.balance,
      },
    });
  } catch (error) {
    console.error('Exchange booking error:', error);
    res.status(500).json({ error: error.message });
  }
};

// CANCEL BOOKING
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (booking.cancelStatus === 'canceled') {
      return res.status(400).json({ error: 'Booking already canceled' });
    }

    // Update booking status
    booking.cancelStatus = 'canceled';
    booking.canceledAt = new Date();
    booking.cancelReason = reason || 'No reason provided';

    if (!booking.history) booking.history = [];
    booking.history.push({
      event: 'BOOKING_CANCELED',
      reason: reason,
      timestamp: new Date(),
    });

    await booking.save();

    // Refund seats to trip
    const trip = await Trip.findByPk(booking.tripId);
    if (trip) {
      trip.seatsAvailable += booking.items[0]?.seats || 1;
      await trip.save();
    }

    // Refund to wallet
    const refundAmount = booking.total;
    await addWalletCredit(userId, refundAmount, {
      type: 'BOOKING_CANCELLATION_REFUND',
      description: 'Refund for canceled booking',
      bookingId: id,
    });

    const updatedWallet = await getWalletBalance(userId);

    return res.json({
      message: 'Booking canceled successfully',
      booking,
      refund: refundAmount,
      wallet: {
        newBalance: updatedWallet.balance,
      },
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL BOOKINGS (for current user)
export const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.findAll({ where: { userId } });
    return res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET SINGLE BOOKING
export const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE BOOKING PAYMENT STATUS
export const updateBookingPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.paymentStatus = status;

    if (!booking.history) booking.history = [];
    booking.history.push({
      event: 'PAYMENT_STATUS_UPDATED',
      newStatus: status,
      timestamp: new Date(),
    });

    await booking.save();

    return res.json({
      message: 'Payment status updated',
      booking,
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: error.message });
  }
};
