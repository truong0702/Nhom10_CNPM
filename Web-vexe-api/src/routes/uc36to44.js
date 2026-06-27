import express from 'express';
import adminFinanceRoutes from './adminFinance.js';
import subscriptionRoutes from './subscription.js';

const router = express.Router();

router.use('/subscriptions', subscriptionRoutes);
router.use('/admin', adminFinanceRoutes);

export default router;

// =========================
// UC45 - Xem danh sách gói dịch vụ
// GET /api/subscriptions/plans
// =========================
router.get("/subscriptions/plans", async (req, res) => {
  try {
    const plans = [
      {
        id: 1,
        name: "Basic",
        price: 500000,
        duration: "30 ngày",
        maxCompanies: 1,
        description: "Gói dành cho nhà xe nhỏ"
      },
      {
        id: 2,
        name: "Standard",
        price: 1000000,
        duration: "30 ngày",
        maxCompanies: 5,
        description: "Gói tiêu chuẩn"
      },
      {
        id: 3,
        name: "Premium",
        price: 2000000,
        duration: "30 ngày",
        maxCompanies: "Không giới hạn",
        description: "Gói cao cấp"
      }
    ];

    res.status(200).json({
      success: true,
      data: plans
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không lấy được danh sách gói."
    });
  }
});
