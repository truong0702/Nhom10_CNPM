import express from 'express';
import { getTrips, getTripById, getSeats, getLocations } from '../controllers/trip.js';

const router = express.Router();

// GET /api/trips/locations - Get all available locations
router.get('/locations', getLocations);

// GET /api/trips/:id - Get trip by ID
router.get('/:id', getTripById);

// GET /api/trips/:id/seats - Get seat information for a trip
router.get('/:id/seats', getSeats);

// GET /api/trips - Search trips
router.get('/', getTrips);

export default router;
