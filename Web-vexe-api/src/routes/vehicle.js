import express from 'express';
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getCarrierVehicles,
  getVehicleCategories,
} from '../controllers/vehicle.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('carrier'));

router.get('/categories', getVehicleCategories);
router.get('/', getCarrierVehicles);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
