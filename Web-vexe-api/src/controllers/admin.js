import bcrypt from 'bcryptjs';
import { Booking, Carrier, Trip, User, Wallet } from '../models/index.js';

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
    const carriers = await Carrier.findAll({ order: [['createdAt', 'DESC']] });
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

    const carrier = await Carrier.create({
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      approved: Boolean(approved),
      status,
      rating: rating ?? 4.5,
      reviews: reviews ?? 0,
    });

    return res.status(201).json({ message: 'Carrier created successfully', carrier });
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
    if (email !== undefined) carrier.email = email;
    if (phone !== undefined) carrier.phone = phone;
    if (address !== undefined) carrier.address = address;
    if (approved !== undefined) carrier.approved = Boolean(approved);
    if (status !== undefined) carrier.status = status;
    if (rating !== undefined) carrier.rating = rating;
    if (reviews !== undefined) carrier.reviews = reviews;

    await carrier.save();
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

export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({ order: [['createdAt', 'DESC']] });
    const userMap = await loadUserMap(bookings.map((booking) => booking.userId));
    const tripMap = await loadTripMap(bookings.map((booking) => booking.tripId));

    return res.json({
      bookings: bookings.map((booking) => {
        const plain = booking.get({ plain: true });
        return {
          ...plain,
          user: userMap.get(booking.userId) ? sanitizeUser(userMap.get(booking.userId), null) : null,
          trip: tripMap.get(booking.tripId) || null,
        };
      }),
    });
  } catch (error) {
    console.error('Failed to get bookings:', error);
    return res.status(500).json({ error: error.message });
  }
};
