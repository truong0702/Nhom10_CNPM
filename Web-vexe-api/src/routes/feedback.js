import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createFeedback, getMyFeedbacks } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/', authenticateToken, createFeedback);
router.get('/', authenticateToken, getMyFeedbacks);

export default router;
