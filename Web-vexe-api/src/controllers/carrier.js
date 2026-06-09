import { Booking, Carrier, Trip, User } from '../models/index.js';

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
    duration: payload.duration || null,
    date: payload.date,
    bus: payload.bus?.trim(),
    seats,
    seatsAvailable,
    price: payload.price !== undefined ? Number(payload.price) : existingTrip?.price,
    rating: existingTrip?.rating ?? 4.5,
    reviews: existingTrip?.reviews ?? 0,
    image: payload.image || existingTrip?.image || null,
  };
};

const validateTripPayload = (payload) => {
  const required = ['carrierId', 'from', 'to', 'departure', 'arrival', 'date', 'bus'];
  for (const field of required) {
    if (!payload[field]) return `${field} is required`;
  }
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
      return res.status(403).json({ error: 'Carrier must be approved and active before creating trips' });
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

export const getCarrierBookings = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const trips = await Trip.findAll({ where: { carrierId: carrier.id }, attributes: ['id'] });
    const tripIds = trips.map((trip) => trip.id);

    const bookings = await Booking.findAll({
      where: { tripId: tripIds },
      include: [
        { model: Trip },
        { model: User, attributes: ['id', 'email', 'fullName', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ carrier, bookings });
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
  getCarrierBookings,
};
