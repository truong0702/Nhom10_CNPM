import { Booking, Carrier, Trip, User } from '../models/index.js';
import { Op } from 'sequelize';

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.password;
  return plain;
};

const getOwnedCarrier = async (userId) => {
  return Carrier.findOne({
    where: { ownerUserId: userId },
    include: [{ model: User, as: 'owner', attributes: ['id', 'email', 'fullName', 'phone'] }],
  });
};

const requireOwnedCarrier = async (req, res) => {
  const carrier = await getOwnedCarrier(req.user.id);
  if (!carrier) {
    res.status(404).json({ error: 'Carrier profile not found for this account' });
    return null;
  }
  return carrier;
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

const withCarrierRevenue = (booking) => {
  const plain = booking.get ? booking.get({ plain: true }) : { ...booking };
  const total = Number(plain.total || 0);
  const isPaid = plain.paymentStatus === 'paid';
  const commissionRate = isPaid ? Number(plain.commissionRate || 0.1) : 0;
  const commissionAmount = isPaid ? Number(plain.commissionAmount || Math.round(total * commissionRate)) : 0;
  const carrierRevenue = isPaid ? Number(plain.carrierRevenue || Math.max(total - commissionAmount, 0)) : 0;
  const result = {
    ...plain,
    commissionRate,
    commissionAmount,
    carrierRevenue,
  };

  const trip = result.Trip || result.trip;
  if (trip?.from && trip?.to && Array.isArray(result.items)) {
    const description = `${trip.from} -> ${trip.to}`;
    result.items = result.items.map((item) => ({
      ...item,
      description: item.description && !/[\uFFFD?]/.test(item.description) ? item.description : description,
    }));
  }

  return result;
};

const normalizeTripPayload = (payload = {}, carrierId, existingTrip = null) => {
  const seats = payload.seats !== undefined ? Number(payload.seats) : existingTrip?.seats;
  const seatsAvailable =
    payload.seatsAvailable !== undefined
      ? Number(payload.seatsAvailable)
      : existingTrip
        ? Math.min(Number(existingTrip.seatsAvailable), Number(seats || existingTrip.seats))
        : Number(seats);

  return {
    carrierId,
    from: payload.from?.trim(),
    to: payload.to?.trim(),
    departure: payload.departure,
    arrival: payload.arrival,
    date: payload.date,
    arrivalDate: payload.arrivalDate || payload.date,
    duration: calculateDuration(payload.date, payload.departure, payload.arrivalDate || payload.date, payload.arrival) || payload.duration || null,
    bus: payload.bus?.trim(),
    vehicleType: payload.vehicleType || existingTrip?.vehicleType || 'seating',
    seats,
    seatsAvailable,
    price: payload.price !== undefined ? Number(payload.price) : existingTrip?.price,
    rating: existingTrip?.rating ?? 4.5,
    reviews: existingTrip?.reviews ?? 0,
    image: payload.image || existingTrip?.image || null,
    status: ['active', 'inactive', 'cancelled'].includes(payload.status) ? payload.status : existingTrip?.status ?? 'active',
  };
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

export const getCarrierProfile = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    return res.json({
      carrier,
      user: sanitizeUser(req.userRecord || null),
    });
  } catch (error) {
    console.error('Carrier profile error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getCarrierTrips = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const trips = await Trip.findAll({
      where: { carrierId: carrier.id },
      order: [['date', 'DESC'], ['departure', 'ASC']],
    });

    return res.json({ carrier, trips });
  } catch (error) {
    console.error('Carrier trips error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const createCarrierTrip = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;
    if (!carrier.approved || carrier.status !== 'active') {
      return res.status(403).json({ error: 'Tai khoan nha xe dang cho admin duyet hoac chua duoc kich hoat' });
    }

    const payload = normalizeTripPayload(req.body, carrier.id);
    const validationError = validateTripPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const trip = await Trip.create(payload);
    return res.status(201).json({ message: 'Trip created successfully', trip });
  } catch (error) {
    console.error('Create carrier trip error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateCarrierTrip = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const trip = await Trip.findOne({ where: { id: req.params.id, carrierId: carrier.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const payload = normalizeTripPayload({ ...trip.get({ plain: true }), ...req.body }, carrier.id, trip);
    const validationError = validateTripPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    await trip.update(payload);
    return res.json({ message: 'Trip updated successfully', trip });
  } catch (error) {
    console.error('Update carrier trip error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteCarrierTrip = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const trip = await Trip.findOne({ where: { id: req.params.id, carrierId: carrier.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const bookingCount = await Booking.count({ where: { tripId: trip.id } });
    if (bookingCount > 0) {
      return res.status(400).json({ error: 'Cannot delete trip with existing bookings' });
    }

    await trip.destroy();
    return res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete carrier trip error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const setCarrierTripStatus = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const { status } = req.body;
    if (!['active', 'inactive', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid trip status' });
    }

    const trip = await Trip.findOne({ where: { id: req.params.id, carrierId: carrier.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await trip.update({
      status,
      seatsAvailable: status === 'cancelled' ? 0 : trip.seatsAvailable,
    });
    return res.json({ message: 'Trip status updated successfully', trip });
  } catch (error) {
    console.error('Update carrier trip status error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const setCarrierTripDepartureTime = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const { departure, arrival, duration, date } = req.body;
    const trip = await Trip.findOne({ where: { id: req.params.id, carrierId: carrier.id } });
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
    console.error('Update carrier trip departure time error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const setCarrierTripRoute = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const { from, to } = req.body;
    const trip = await Trip.findOne({ where: { id: req.params.id, carrierId: carrier.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!from || !to) return res.status(400).json({ error: 'from and to are required' });

    await trip.update({ from: from.trim(), to: to.trim() });
    return res.json({ message: 'Trip route updated successfully', trip });
  } catch (error) {
    console.error('Update carrier trip route error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const cancelCarrierTrip = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const trip = await Trip.findOne({ where: { id: req.params.id, carrierId: carrier.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await trip.update({ status: 'cancelled', seatsAvailable: 0 });
    return res.json({ message: 'Trip cancelled successfully', trip });
  } catch (error) {
    console.error('Cancel carrier trip error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getCarrierBookings = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const trips = await Trip.findAll({ where: { carrierId: carrier.id }, attributes: ['id'] });
    const tripIds = trips.map((trip) => trip.id);

    const bookings = tripIds.length === 0 ? [] : await Booking.findAll({
      where: { tripId: { [Op.in]: tripIds } },
      include: [
        { model: Trip },
        { model: User, attributes: ['id', 'email', 'fullName', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ carrier, bookings: bookings.map(withCarrierRevenue) });
  } catch (error) {
    console.error('Carrier bookings error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  getCarrierProfile,
  getCarrierTrips,
  createCarrierTrip,
  updateCarrierTrip,
  deleteCarrierTrip,
  setCarrierTripStatus,
  setCarrierTripDepartureTime,
  setCarrierTripRoute,
  cancelCarrierTrip,
  getCarrierBookings,
};
