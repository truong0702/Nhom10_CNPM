import express from 'express';
import {
  getBankInfo,
  createBankTransferPayment,
  getPaymentDetails,
  verifyBankTransfer,
  rejectBankTransfer,
  getPendingBankTransfers,
  getPaymentsAdmin,
} from '../controllers/payment.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get('/admin/pending', authenticateToken, authorize('admin'), getPendingBankTransfers);
router.get('/admin/all', authenticateToken, authorize('admin'), getPaymentsAdmin);
router.post('/admin/:paymentId/verify', authenticateToken, authorize('admin'), verifyBankTransfer);
router.post('/admin/:paymentId/reject', authenticateToken, authorize('admin'), rejectBankTransfer);

// Public routes
router.get('/bank-info', getBankInfo);

// User routes (authenticated)
router.post('/bank-transfer', authenticateToken, createBankTransferPayment);
router.get('/:paymentId', authenticateToken, getPaymentDetails);

export default router;
