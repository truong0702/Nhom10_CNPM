import bcrypt from 'bcryptjs';
import { Booking, Carrier, Trip, User, Wallet, Feedback } from '../models/index.js';

const sanitizeUser = (user, wallet = null) => {
  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.password;
  return {
    ...plain,
    wallet: wallet ? {
      balance: wallet.balance,
      history: wallet.history || [],
    } : null,
  };
};

const loadWalletMap = async (userIds = []) => {
  const wallets = await Wallet.findAll({ where: { userId: userIds } });
  return new Map(wallets.map((wallet) => [wallet.userId, wallet]));
};

const loadTripMap = async (tripIds = []) => {
  const trips = await Trip.findAll({ where: { id: tripIds } });
  return new Map(trips.map((trip) => [trip.id, trip]));
};

const loadUserMap = async (userIds = []) => {
  const users = await User.findAll({ where: { id: userIds } });
  return new Map(users.map((user) => [user.id, user]));
};

const withRevenueFields = (booking) => {
  const plain = booking.get ? booking.get({ plain: true }) : { ...booking };
  const total = Number(plain.total || 0);
  const isPaid = plain.paymentStatus === 'paid';
  const commissionRate = isPaid ? Number(plain.commissionRate || 0.1) : 0;
  const commissionAmount = isPaid ? Number(plain.commissionAmount || Math.round(total * commissionRate)) : 0;
  const carrierRevenue = isPaid ? Number(plain.carrierRevenue || Math.max(total - commissionAmount, 0)) : 0;
  return {
    ...plain,
    commissionRate,
    commissionAmount,
    carrierRevenue,
  };
};

const withTripItemDescriptions = (plainBooking) => {
  const trip = plainBooking.trip || plainBooking.Trip;
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

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    const walletMap = await loadWalletMap(users.map((user) => user.id));

    return res.json({
      users: users.map((user) => sanitizeUser(user, walletMap.get(user.id) || null)),
    });
  } catch (error) {
    console.error('Failed to get users:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, password, phone, role, isVerified } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    const wallet = await Wallet.findOne({ where: { userId: user.id } });
    return res.json({ message: 'User updated successfully', user: sanitizeUser(user, wallet) });
  } catch (error) {
    console.error('Failed to update user:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await Wallet.destroy({ where: { userId: user.id } });
    await user.destroy();

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getCarriers = async (req, res) => {
  try {
    const carriers = await Carrier.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'fullName', 'phone', 'role', 'isVerified'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ carriers });
  } catch (error) {
    console.error('Failed to get carriers:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const createCarrier = async (req, res) => {
  try {
    const { name, email, phone, address, approved = false, status = 'active', rating, reviews } = req.body;
    if (!name) return res.status(400).json({ error: 'Carrier name is required' });

    const normalizedEmail = email?.trim() || null;
    let ownerUser = null;

    if (normalizedEmail) {
      const existingCarrier = await Carrier.findOne({ where: { email: normalizedEmail } });
      if (existingCarrier) return res.status(409).json({ error: 'Carrier email already exists' });

      ownerUser = await User.findOne({ where: { email: normalizedEmail } });
      if (ownerUser && ownerUser.role !== 'carrier') {
        return res.status(409).json({ error: 'Email already belongs to a non-carrier user' });
      }

      if (!ownerUser) {
        ownerUser = await User.create({
          email: normalizedEmail,
          password: await bcrypt.hash('123456', 10),
          fullName: name,
          phone: phone || null,
          role: 'carrier',
          isVerified: Boolean(approved),
        });
      } else {
        await ownerUser.update({
          fullName: ownerUser.fullName || name,
          phone: phone || ownerUser.phone,
          role: 'carrier',
          isVerified: Boolean(approved) || ownerUser.isVerified,
        });
      }
    }

    const carrier = await Carrier.create({
      name,
      email: normalizedEmail,
      phone: phone || null,
      address: address || null,
      ownerUserId: ownerUser?.id || null,
      approved: Boolean(approved),
      status,
      rating: rating ?? 4.5,
      reviews: reviews ?? 0,
    });

    return res.status(201).json({
      message: ownerUser
        ? 'Carrier and login account created successfully. Default password is 123456.'
        : 'Carrier created successfully',
      carrier,
      owner: ownerUser ? sanitizeUser(ownerUser, null) : null,
    });
  } catch (error) {
    console.error('Failed to create carrier:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateCarrier = async (req, res) => {
  try {
    const { id } = req.params;
    const carrier = await Carrier.findByPk(id);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    const { name, email, phone, address, approved, status, rating, reviews } = req.body;
    if (name !== undefined) carrier.name = name;
    if (email !== undefined) {
      const normalizedEmail = email?.trim() || null;
      if (normalizedEmail) {
        const existingCarrier = await Carrier.findOne({ where: { email: normalizedEmail } });
        if (existingCarrier && existingCarrier.id !== carrier.id) {
          return res.status(409).json({ error: 'Carrier email already exists' });
        }
      }
      carrier.email = normalizedEmail;
    }
    if (phone !== undefined) carrier.phone = phone;
    if (address !== undefined) carrier.address = address;
    if (approved !== undefined) carrier.approved = Boolean(approved);
    if (status !== undefined) carrier.status = status;
    if (rating !== undefined) carrier.rating = rating;
    if (reviews !== undefined) carrier.reviews = reviews;

    await carrier.save();

    if (carrier.ownerUserId) {
      const owner = await User.findByPk(carrier.ownerUserId);
      if (owner) {
        if (email !== undefined && carrier.email && owner.email !== carrier.email) {
          const existingUser = await User.findOne({ where: { email: carrier.email } });
          if (!existingUser || existingUser.id === owner.id) owner.email = carrier.email;
        }
        if (phone !== undefined) owner.phone = phone;
        await owner.save();
      }
    }

    return res.json({ message: 'Carrier updated successfully', carrier });
  } catch (error) {
    console.error('Failed to update carrier:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const approveCarrier = async (req, res) => {
  try {
    const { id } = req.params;
    const carrier = await Carrier.findByPk(id);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    carrier.approved = true;
    carrier.status = 'active';
    await carrier.save();

    if (carrier.ownerUserId) {
      const owner = await User.findByPk(carrier.ownerUserId);
      if (owner) {
        owner.isVerified = true;
        await owner.save();
      }
    }

    return res.json({ message: 'Carrier approved successfully', carrier });
  } catch (error) {
    console.error('Failed to approve carrier:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const setCarrierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const carrier = await Carrier.findByPk(id);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    carrier.status = status === 'inactive' ? 'inactive' : 'active';
    await carrier.save();

    return res.json({ message: 'Carrier status updated successfully', carrier });
  } catch (error) {
    console.error('Failed to update carrier status:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteCarrier = async (req, res) => {
  try {
    const { id } = req.params;
    const carrier = await Carrier.findByPk(id);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    await carrier.destroy();
    return res.json({ message: 'Carrier deleted successfully' });
  } catch (error) {
    console.error('Failed to delete carrier:', error);
    return res.status(500).json({ error: error.message });
  }
};

const normalizeTripPayload = (payload = {}, existingTrip = null) => {
  const seats = payload.seats !== undefined ? Number(payload.seats) : existingTrip?.seats;
  const seatsAvailable =
    payload.seatsAvailable !== undefined
      ? Number(payload.seatsAvailable)
      : existingTrip
        ? Math.min(Number(existingTrip.seatsAvailable), Number(seats || existingTrip.seats))
        : Number(seats);

  const arrivalDate = payload.arrivalDate || payload.date;

  return {
    carrierId: payload.carrierId,
    from: payload.from?.trim(),
    to: payload.to?.trim(),
    departure: payload.departure,
    arrival: payload.arrival,
    date: payload.date,
    arrivalDate,
    duration: calculateDuration(payload.date, payload.departure, arrivalDate, payload.arrival) || payload.duration || null,
    bus: payload.bus?.trim(),
    vehicleType: payload.vehicleType || existingTrip?.vehicleType || 'seating',
    seats,
    seatsAvailable,
    price: payload.price !== undefined ? Number(payload.price) : existingTrip?.price,
    rating: payload.rating !== undefined && payload.rating !== '' ? Number(payload.rating) : existingTrip?.rating ?? 4.5,
    reviews: payload.reviews !== undefined && payload.reviews !== '' ? Number(payload.reviews) : existingTrip?.reviews ?? 0,
    image: payload.image || null,
    status: ['active', 'inactive', 'cancelled'].includes(payload.status) ? payload.status : existingTrip?.status ?? 'active',
  };
};

const calculateDuration = (date, departure, arrivalDate, arrival) => {
  if (!date || !departure || !arrival) return null;
  const start = new Date(`${date}T${departure}`);
  const end = new Date(`${arrivalDate || date}T${arrival}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;

  const totalMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

const validateTripPayload = (payload) => {
  const required = ['carrierId', 'from', 'to', 'departure', 'arrival', 'date', 'arrivalDate', 'bus', 'vehicleType'];
  for (const field of required) {
    if (!payload[field]) return `${field} is required`;
  }
  if (!calculateDuration(payload.date, payload.departure, payload.arrivalDate, payload.arrival)) {
    return 'arrival time must be after departure time';
  }
  if (!['sleeping', 'seating'].includes(payload.vehicleType)) return 'vehicleType is invalid';
  if (!Number.isFinite(payload.seats) || payload.seats <= 0) return 'seats must be greater than 0';
  if (!Number.isFinite(payload.seatsAvailable) || payload.seatsAvailable < 0) return 'seatsAvailable must be 0 or greater';
  if (payload.seatsAvailable > payload.seats) return 'seatsAvailable cannot exceed seats';
  if (!Number.isFinite(payload.price) || payload.price <= 0) return 'price must be greater than 0';
  return null;
};

export const getTrips = async (req, res) => {
  try {
    const trips = await Trip.findAll({
      include: [{ model: Carrier, attributes: ['id', 'name', 'status', 'approved'] }],
      order: [['date', 'DESC'], ['departure', 'ASC']],
    });

    return res.json({ trips });
  } catch (error) {
    console.error('Failed to get trips:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const createTrip = async (req, res) => {
  try {
    const payload = normalizeTripPayload(req.body);
    const validationError = validateTripPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const carrier = await Carrier.findByPk(payload.carrierId);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    const trip = await Trip.create(payload);
    return res.status(201).json({ message: 'Trip created successfully', trip });
  } catch (error) {
    console.error('Failed to create trip:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const payload = normalizeTripPayload({ ...trip.get({ plain: true }), ...req.body }, trip);
    const validationError = validateTripPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const carrier = await Carrier.findByPk(payload.carrierId);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    await trip.update(payload);
    return res.json({ message: 'Trip updated successfully', trip });
  } catch (error) {
    console.error('Failed to update trip:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const bookingCount = await Booking.count({ where: { tripId: id } });
    if (bookingCount > 0) {
      return res.status(400).json({ error: 'Cannot delete trip with existing bookings' });
    }

    await trip.destroy();
    return res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Failed to delete trip:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({ order: [['createdAt', 'DESC']] });
    const userMap = await loadUserMap(bookings.map((booking) => booking.userId));
    const tripMap = await loadTripMap(bookings.map((booking) => booking.tripId));

    return res.json({
      bookings: bookings.map((booking) => {
        const plain = withRevenueFields(booking);
        return withTripItemDescriptions({
          ...plain,
          user: userMap.get(booking.userId) ? sanitizeUser(userMap.get(booking.userId), null) : null,
          trip: tripMap.get(booking.tripId) || null,
        });
      }),
    });
  } catch (error) {
    console.error('Failed to get bookings:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: Booking,
          required: false,
          include: [
            {
              model: Trip,
              required: false,
              attributes: ['id', 'from', 'to', 'bus', 'departure', 'date'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ feedbacks });
  } catch (error) {
    console.error('Failed to get feedbacks:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (status !== undefined) feedback.status = status;
    if (adminReply !== undefined) feedback.adminReply = adminReply;

    await feedback.save();
    return res.json({ message: 'Feedback updated successfully', feedback });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const setTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (!['active', 'inactive', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid trip status' });
    }

    await trip.update({
      status,
      seatsAvailable: status === 'cancelled' ? 0 : trip.seatsAvailable,
    });
    return res.json({ message: 'Trip status updated successfully', trip });
  } catch (error) {
    console.error('Failed to update trip status:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const setTripDepartureTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { departure, arrival, duration, date } = req.body;
    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (!departure) return res.status(400).json({ error: 'departure is required' });

    await trip.update({
      departure,
      arrival: arrival ?? trip.arrival,
      duration: duration ?? trip.duration,
      date: date ?? trip.date,
    });
    return res.json({ message: 'Trip departure time updated successfully', trip });
  } catch (error) {
    console.error('Failed to update trip departure time:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const setTripRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.body;
    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (!from || !to) return res.status(400).json({ error: 'from and to are required' });

    await trip.update({ from: from.trim(), to: to.trim() });
    return res.json({ message: 'Trip route updated successfully', trip });
  } catch (error) {
    console.error('Failed to update trip route:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await trip.update({ status: 'cancelled', seatsAvailable: 0 });
    return res.json({ message: 'Trip cancelled successfully', trip });
  } catch (error) {
    console.error('Failed to cancel trip:', error);
    return res.status(500).json({ error: error.message });
  }
};
