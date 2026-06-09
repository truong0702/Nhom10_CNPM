import Trip from '../models/Trip.js';
import Carrier from '../models/Carrier.js';
import Booking from '../models/Booking.js';

export const getTrips = async (req, res) => {
  try {
    const { from, to, date, timeOfDay, vehicleType, limit = 10, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (from) where.from = from;
    if (to) where.to = to;
    if (date) where.date = date;

    // Query trips
    const trips = await Trip.findAll({
      where,
      include: [{ model: Carrier, attributes: ['id', 'name', 'status', 'approved'] }],
      order: [['createdAt', 'DESC']]
    });
    const filteredTrips = trips.filter((trip) => {
      if (timeOfDay && getTimeOfDay(trip.departure) !== timeOfDay) return false;
      if (vehicleType && getVehicleType(trip.bus) !== vehicleType) return false;
      return true;
    });

    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const pagedTrips = filteredTrips.slice(start, end);

    res.json({
      success: true,
      data: pagedTrips,
      count: pagedTrips.length,
      total: filteredTrips.length
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getTimeOfDay = (departure = '') => {
  const hour = Number.parseInt(String(departure).split(':')[0], 10);
  if (!Number.isFinite(hour)) return '';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
};

const getVehicleType = (bus = '') => {
  const text = String(bus).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (text.includes('giuong') || text.includes('limousine') || text.includes('sleeper')) return 'sleeping';
  if (text.includes('ghe') || text.includes('ngoi') || text.includes('seat')) return 'seating';
  return '';
};

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findByPk(id, {
      include: [{ model: Carrier, attributes: ['id', 'name', 'status', 'approved'] }],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getSeats = async (req, res) => {
  try {
    const { id: tripId } = req.params;

    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    const bookings = await Booking.findAll({
      where: { tripId, cancelStatus: 'active' },
      attributes: ['items'],
    });
    const occupiedSeatLabels = bookings.flatMap((booking) => {
      const items = Array.isArray(booking.items) ? booking.items : [];
      return items.flatMap((item) => item.selectedSeatLabels || item.selectedSeats || []);
    }).map((label) => Number(label)).filter((label) => Number.isFinite(label));
    const occupiedSet = new Set(occupiedSeatLabels);

    // Generate seat map
    const cols = 4;
    const rows = Math.ceil(Number(trip.seats || 0) / cols);
    const seatMap = [];

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const label = (row - 1) * cols + col;
        if (label > Number(trip.seats || 0)) continue;
        seatMap.push({
          label,
          row,
          col,
          available: !occupiedSet.has(label)
        });
      }
    }

    res.json({
      success: true,
      data: {
        tripId,
        totalSeats: trip.seats,
        availableSeats: trip.seatsAvailable,
        occupiedSeats: occupiedSet.size,
        occupiedSeatLabels: Array.from(occupiedSet),
        seatMap
      }
    });
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getLocations = async (req, res) => {
  try {
    // Get all unique departure and destination locations
    const trips = await Trip.findAll({
      attributes: ['from', 'to'],
      raw: true
    });

    const locations = new Set();
    trips.forEach(trip => {
      if (trip.from) locations.add(trip.from);
      if (trip.to) locations.add(trip.to);
    });

    res.json({
      success: true,
      data: Array.from(locations).sort()
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
