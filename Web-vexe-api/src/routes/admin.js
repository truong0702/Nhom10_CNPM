import express from 'express';
import {
  getUsers,
  updateUser,
  deleteUser,
  getCarriers,
  createCarrier,
  updateCarrier,
  approveCarrier,
  setCarrierStatus,
  deleteCarrier,
  getBookings,
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getFeedbacks,
  updateFeedback,
  setTripStatus,
  setTripDepartureTime,
  setTripRoute,
  cancelTrip,
} from '../controllers/admin.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/carriers', getCarriers);
router.post('/carriers', createCarrier);
router.put('/carriers/:id', updateCarrier);
router.patch('/carriers/:id/approve', approveCarrier);
router.patch('/carriers/:id/status', setCarrierStatus);
router.delete('/carriers/:id', deleteCarrier);

router.get('/trips', getTrips);
router.post('/trips', createTrip);
router.put('/trips/:id', updateTrip);
router.put('/trips/:id/status', setTripStatus);
router.put('/trips/:id/departure-time', setTripDepartureTime);
router.put('/trips/:id/route', setTripRoute);
router.put('/trips/:id/cancel', cancelTrip);
router.delete('/trips/:id', deleteTrip);

router.get('/bookings', getBookings);

router.get('/feedbacks', getFeedbacks);
router.put('/feedbacks/:id', updateFeedback);

export default router;
