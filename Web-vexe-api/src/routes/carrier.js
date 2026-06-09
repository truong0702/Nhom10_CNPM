import express from 'express';
import {
  createCarrierTrip,
  deleteCarrierTrip,
  getCarrierBookings,
  getCarrierProfile,
  getCarrierTrips,
  updateCarrierTrip,
} from '../controllers/carrier.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('carrier'));

router.get('/me', getCarrierProfile);
router.get('/trips', getCarrierTrips);
router.post('/trips', createCarrierTrip);
router.put('/trips/:id', updateCarrierTrip);
router.delete('/trips/:id', deleteCarrierTrip);
router.get('/bookings', getCarrierBookings);

export default router;
