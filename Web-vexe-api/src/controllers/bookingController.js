import { Booking, Trip, User, Wallet, Payment } from '../models/index.js';
import { sendBookingConfirmation } from '../utils/mailer.js';
import { expirePendingBookings } from '../services/bookingExpiry.js';

const CARRIER_COMMISSION_RATE = 0.1;

const getTicketCode = (bookingId) => `VE-${String(bookingId || '').slice(0, 8).toUpperCase()}`;

const getSelectedSeatLabels = (items) => (Array.isArray(items) ? items : [])
  .flatMap((item) => item.selectedSeatLabels || item.selectedSeats || [])
  .map((label) => String(label));

const getSeatCount = (items) => {
  if (!Array.isArray(items)) return 1;
  return items.reduce((sum, item) => {
    const selectedSeats = item.selectedSeatLabels || item.selectedSeats || [];
    return sum + Number(item.seats || selectedSeats.length || item.qty || 1);
  }, 0);
};

const getNumericSeatLabels = (items) => (Array.isArray(items) ? items : [])
  .flatMap((item) => item.selectedSeatLabels || item.selectedSeats || [])
  .map((label) => Number(label))
  .filter((label) => Number.isFinite(label));

const hasSameSeatSet = (left, right) => {
  if (!left.length || left.length !== right.length) return false;
  const rightSet = new Set(right.map((label) => Number(label)));
  return left.every((label) => rightSet.has(Number(label)));
};

const findReusablePendingBooking = async ({ userId, tripId, requestedSeatLabels, totalAmount }) => {
  if (!requestedSeatLabels.length) return null;

  const pendingBookings = await Booking.findAll({
    where: {
      userId,
      tripId,
      cancelStatus: 'active',
      paymentStatus: 'pending',
    },
    order: [['createdAt', 'DESC']],
  });

  return pendingBookings.find((booking) => {
    const bookingSeatLabels = getNumericSeatLabels(booking.items);
    const sameSeats = hasSameSeatSet(requestedSeatLabels, bookingSeatLabels);
    const sameTotal = Number(booking.total || 0) === Number(totalAmount || 0);
    return sameSeats && sameTotal;
  }) || null;
};

const getPaymentMethodLabel = (paymentMethod) => {
  if (paymentMethod === 'wallet') return 'Vi VeXe';
  if (paymentMethod === 'cash_at_station') return 'Thanh toan tai quay';
  return 'Chuyen khoan ngan hang';
};

const applyCarrierCommission = (booking) => {
  const total = Number(booking.total || 0);
  const commissionAmount = Math.round(total * CARRIER_COMMISSION_RATE);
  booking.commissionRate = CARRIER_COMMISSION_RATE;
  booking.commissionAmount = commissionAmount;
  booking.carrierRevenue = Math.max(total - commissionAmount, 0);
};

const clearCarrierCommission = (booking) => {
  booking.commissionRate = 0;
  booking.commissionAmount = 0;
  booking.carrierRevenue = 0;
};

const withTripItemDescriptions = (plainBooking) => {
  const trip = plainBooking.Trip || plainBooking.trip;
  if (!trip?.from || !trip?.to || !Array.isArray(plainBooking.items)) {
    return plainBooking;
  }

  const description = `${trip.from} -> ${trip.to}`;
  return {
    ...plainBooking,
    items: plainBooking.items.map((item) => ({
      ...item,
      description: item.description && !/[\uFFFD?]/.test(item.description) ? item.description : description,
    })),
  };
};

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
  wallet.balance = Number(wallet.balance || 0) + Number(amount || 0);
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
    const { tripId, items, total, paymentMethod } = req.body;
    const userId = req.user.id;

    await expirePendingBookings({ tripId });

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

    const bookingItems = Array.isArray(items) ? items : [
      {
        description: `${trip.from} -> ${trip.to}`,
        seats: totalSeats,
        price: trip.price,
        total: total || trip.price * totalSeats,
      }
    ];

    const totalAmount = Number(total) || Number(trip.price * totalSeats);
    const requestedSeatLabels = getNumericSeatLabels(bookingItems);

    const reusableBooking = await findReusablePendingBooking({
      userId,
      tripId,
      requestedSeatLabels,
      totalAmount,
    });

    if (reusableBooking) {
      return res.status(200).json({
        message: 'Reusing existing pending booking',
        booking: {
          ...reusableBooking.toJSON(),
          ticketCode: getTicketCode(reusableBooking.id),
        },
        trip: {
          id: trip.id,
          seatsRemaining: trip.seatsAvailable,
        },
      });
    }

    // Validate seats available
    if (trip.seatsAvailable < totalSeats) {
      return res.status(400).json({
        error: 'Not enough seats available',
        available: trip.seatsAvailable,
        requested: totalSeats,
      });
    }

    if (requestedSeatLabels.length) {
      const existingBookings = await Booking.findAll({
        where: { tripId, cancelStatus: 'active' },
        attributes: ['items'],
      });
      const occupiedSeatLabels = existingBookings
        .flatMap((booking) => (Array.isArray(booking.items) ? booking.items : []))
        .flatMap((item) => item.selectedSeatLabels || item.selectedSeats || [])
        .map((label) => Number(label))
        .filter((label) => Number.isFinite(label));
      const occupiedSet = new Set(occupiedSeatLabels);
      const duplicatedSeats = requestedSeatLabels.filter((label) => occupiedSet.has(label));

      if (duplicatedSeats.length) {
        return res.status(400).json({
          error: 'Some selected seats are no longer available',
          seats: Array.from(new Set(duplicatedSeats)),
        });
      }
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      tripId,
      items: bookingItems,
      total: totalAmount,
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentStatus: 'pending',
      cancelStatus: 'active',
    });

    // Deduct seats from trip
    trip.seatsAvailable -= totalSeats;
    await trip.save();

    // Add to history
    if (!booking.history) booking.history = [];
    const ticketCode = getTicketCode(booking.id);
    booking.history.push({
      event: 'BOOKING_CREATED',
      timestamp: new Date(),
      seats: totalSeats,
      total: booking.total,
      ticketCode,
    });
    await booking.save();

    const user = await User.findByPk(userId, {
      attributes: ['email', 'fullName'],
    });

    if (user?.email) {
      try {
        await sendBookingConfirmation(user.email, {
          ticketCode,
          fullName: user.fullName,
          from: trip.from,
          to: trip.to,
          date: trip.date,
          departure: trip.departure,
          arrival: trip.arrival,
          bus: trip.bus,
          seats: getSelectedSeatLabels(bookingItems),
          seatCount: getSeatCount(bookingItems),
          total: totalAmount,
          paymentMethod: getPaymentMethodLabel(booking.paymentMethod),
        });
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
      }
    }

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        ...booking.toJSON(),
        ticketCode,
      },
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
    const requesterId = req.user.id;

    // Get current booking
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Verify ownership
    if (booking.userId !== requesterId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Cannot exchange this booking' });
    }
    const walletUserId = booking.userId;

    // Check if already canceled
    if (booking.cancelStatus === 'canceled') {
      return res.status(400).json({ error: 'Cannot exchange a canceled booking' });
    }

    const nextItem = Array.isArray(toItems) ? toItems[0] : toItems;
    const oldTripId = booking.tripId;
    const oldSeats = Number(booking.items?.[0]?.seats || booking.items?.[0]?.qty || 1);
    const newTripId = nextItem?.tripId || nextItem?.id;
    const exchangeSeats = Number(nextItem?.seats || nextItem?.selectedSeatLabels?.length || nextItem?.qty || oldSeats || 1);

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
    const newTotal = Number(nextItem?.total || Number(newTrip.price) * exchangeSeats);
    const priceDifference = newTotal - oldTotal;

    const exchangeFee = Math.ceil(Number(oldTotal) * 0.05);

    // Track exchange in history
    if (!booking.exchanges) booking.exchanges = [];
    booking.exchanges.push({
      from: {
        tripId: oldTrip?.id,
        route: `${oldTrip?.from} -> ${oldTrip?.to}`,
        seats: oldSeats,
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
    booking.items = Array.isArray(toItems) && toItems.length ? toItems : [
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
      oldTrip: oldTripId,
      newTrip: newTripId,
      priceDifference,
      exchangeFee,
      timestamp: new Date(),
    });

    await booking.save();

    // Update seat counts
    if (oldTrip) {
      oldTrip.seatsAvailable += oldSeats;
      await oldTrip.save();
    }
    newTrip.seatsAvailable -= exchangeSeats;
    await newTrip.save();

    // Update wallet for fees
    if (exchangeFee > 0) {
      await addWalletCredit(walletUserId, -exchangeFee, {
        type: 'EXCHANGE_FEE',
        description: 'Exchange fee',
        bookingId: id,
      });
    }

    if (priceDifference > 0) {
      await addWalletCredit(walletUserId, -priceDifference, {
        type: 'EXCHANGE_ADDITIONAL_CHARGE',
        description: 'Additional charge for exchange',
        bookingId: id,
      });
    } else if (priceDifference < 0) {
      await addWalletCredit(walletUserId, Math.abs(priceDifference), {
        type: 'EXCHANGE_REFUND',
        description: 'Refund from exchange',
        bookingId: id,
      });
    }

    const updatedWallet = await getWalletBalance(walletUserId);

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
    const requesterId = req.user.id;

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== requesterId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const walletUserId = booking.userId;

    if (booking.cancelStatus === 'canceled') {
      return res.status(400).json({ error: 'Booking already canceled' });
    }

    // Update booking status
    booking.cancelStatus = 'canceled';
    booking.canceledAt = new Date();
    booking.cancelReason = reason || 'No reason provided';

    const cancelFee = Math.round(Number(booking.total) * 0.1);
    const refundAmount = Number(booking.total) - cancelFee;

    if (!booking.history) booking.history = [];
    booking.history.push({
      event: 'BOOKING_CANCELED',
      reason: reason,
      cancelFee,
      refundAmount,
      timestamp: new Date(),
    });

    await booking.save();

    // Refund seats to trip
    const trip = await Trip.findByPk(booking.tripId);
    if (trip) {
      trip.seatsAvailable += booking.items[0]?.seats || 1;
      await trip.save();
    }

    await addWalletCredit(walletUserId, refundAmount, {
      type: 'BOOKING_CANCELLATION_REFUND',
      description: 'Refund for canceled booking',
      bookingId: id,
    });

    const updatedWallet = await getWalletBalance(walletUserId);

    return res.json({
      message: 'Booking canceled successfully',
      booking,
      cancelFee,
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
    await expirePendingBookings({ userId });
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        {
          model: Trip,
          attributes: ['from', 'to', 'departure', 'arrival', 'bus', 'date'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get payment status for each booking
    const bookingsWithPayment = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({
          where: { bookingId: booking.id },
          order: [['createdAt', 'DESC']],
        });
        const plainBooking = withTripItemDescriptions(booking.toJSON());
        return {
          ...plainBooking,
          ticketCode: getTicketCode(booking.id),
          payment: payment ? {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            method: payment.paymentMethod,
            createdAt: payment.createdAt,
            verifiedAt: payment.verifiedAt,
          } : null,
        };
      })
    );

    return res.json({ bookings: bookingsWithPayment });
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
    await expirePendingBookings({ userId });

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get payment info
    const payment = await Payment.findOne({
      where: { bookingId: id },
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      booking: {
        ...withTripItemDescriptions(booking.toJSON()),
        ticketCode: getTicketCode(booking.id),
        payment: payment ? {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          method: payment.paymentMethod,
          createdAt: payment.createdAt,
          verifiedAt: payment.verifiedAt,
        } : null,
      },
    });
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
    const requesterId = req.user.id;

    if (!['pending', 'paid', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== requesterId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    booking.paymentStatus = status;
    if (status === 'paid') {
      applyCarrierCommission(booking);
    } else {
      clearCarrierCommission(booking);
    }

    const latestPayment = await Payment.findOne({
      where: { bookingId: booking.id },
      order: [['createdAt', 'DESC']],
    });

    if (latestPayment) {
      if (status === 'paid') {
        latestPayment.status = 'verified';
        latestPayment.verifiedBy = req.user.role === 'admin' ? req.user.id : latestPayment.verifiedBy;
        latestPayment.verifiedAt = latestPayment.verifiedAt || new Date();
      } else if (status === 'failed') {
        latestPayment.status = 'failed';
        latestPayment.verifiedBy = req.user.role === 'admin' ? req.user.id : latestPayment.verifiedBy;
        latestPayment.verifiedAt = latestPayment.verifiedAt || new Date();
      } else {
        latestPayment.status = 'pending';
        latestPayment.verifiedBy = null;
        latestPayment.verifiedAt = null;
      }
      await latestPayment.save();
    }

    if (!booking.history) booking.history = [];
    booking.history.push({
      event: 'PAYMENT_STATUS_UPDATED',
      newStatus: status,
      paymentStatus: latestPayment?.status || null,
      commissionRate: booking.commissionRate,
      commissionAmount: booking.commissionAmount,
      carrierRevenue: booking.carrierRevenue,
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
