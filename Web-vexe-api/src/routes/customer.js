import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createSupportSurvey } from '../controllers/surveyController.js';

const router = express.Router();

// POST /api/customer/support-survey
router.post('/support-survey', authenticateToken, createSupportSurvey);

export default router;
