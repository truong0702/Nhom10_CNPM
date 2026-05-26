import express from 'express';
import { getWalletBalance, getWalletHistory } from '../controllers/wallet.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getWalletBalance);
router.get('/history', authenticateToken, getWalletHistory);

export default router;