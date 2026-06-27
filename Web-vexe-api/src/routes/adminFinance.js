import express from 'express';
import {
  calculateServiceFee,
  reconciliation,
  recordCodPayment,
  revenueReport,
  splitPayment,
} from '../controllers/adminFinance.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('admin'));

router.post('/calculate-fee', calculateServiceFee);
router.post('/payments/split', splitPayment);
router.post('/payments/cod', recordCodPayment);
router.get('/reconciliation', reconciliation);
router.get('/revenue-report', revenueReport);

export default router;
