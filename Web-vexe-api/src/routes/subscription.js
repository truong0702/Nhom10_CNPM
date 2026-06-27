import express from 'express';
import {
  cancelSubscriptionById,
  createSubscription,
  getSubscriptionPaymentHistory,
  renewSubscriptionById,
} from '../controllers/subscription.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// =========================
// UC45 - Xem danh sách gói dịch vụ
// Không cần đăng nhập
// GET /api/subscriptions/plans
// =========================
router.get('/plans', (req, res) => {
  console.log('=== UC45 - GET /api/subscriptions/plans ===');

  const plans = [
    {
      id: 1,
      name: 'Basic',
      price: 500000,
      duration: '30 ngày',
      maxCompanies: 1,
      description: 'Gói dành cho nhà xe nhỏ'
    },
    {
      id: 2,
      name: 'Standard',
      price: 1000000,
      duration: '30 ngày',
      maxCompanies: 5,
      description: 'Gói tiêu chuẩn'
    },
    {
      id: 3,
      name: 'Premium',
      price: 2000000,
      duration: '30 ngày',
      maxCompanies: 'Không giới hạn',
      description: 'Gói cao cấp'
    }
  ];

  return res.status(200).json({
    success: true,
    data: plans
  });
});

// Các API bên dưới mới yêu cầu đăng nhập
router.use(authenticateToken);

// UC36
router.post('/', createSubscription);

// UC37
router.put('/:id/renew', renewSubscriptionById);

// UC38
router.put('/:id/cancel', cancelSubscriptionById);

// UC39
router.get('/payment-history', getSubscriptionPaymentHistory);

export default router;