import express from 'express';
import {
  createCarrierTrip,
  cancelCarrierTrip,
  deleteCarrierTrip,
  getCarrierBookings,
  getCarrierProfile,
  getCarrierTrips,
  setCarrierTripDepartureTime,
  setCarrierTripRoute,
  setCarrierTripStatus,
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
router.put('/trips/:id/status', setCarrierTripStatus);
router.put('/trips/:id/departure-time', setCarrierTripDepartureTime);
router.put('/trips/:id/route', setCarrierTripRoute);
router.put('/trips/:id/cancel', cancelCarrierTrip);
router.delete('/trips/:id', deleteCarrierTrip);
router.get('/bookings', getCarrierBookings);

export default router;
