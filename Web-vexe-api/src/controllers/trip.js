import Trip from '../models/Trip.js';

export const getTrips = async (req, res) => {
  try {
    const { from, to, date, limit = 10, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (from) where.from = from;
    if (to) where.to = to;
    if (date) where.date = date;

    // Query trips
    const trips = await Trip.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: trips,
      count: trips.length
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findByPk(id);

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

    // Generate seat map (6 rows x 4 columns = 24 seats)
    const rows = 6;
    const cols = 4;
    const seatMap = [];

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        seatMap.push({
          row,
          col,
          available: true
        });
      }
    }

    res.json({
      success: true,
      data: {
        tripId,
        totalSeats: trip.seats,
        availableSeats: trip.seats,
        occupiedSeats: 0,
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
