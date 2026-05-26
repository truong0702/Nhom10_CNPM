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

router.get('/bookings', getBookings);

export default router;
