import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
  getMyChatMessages,
  sendChatMessage,
  getAdminConversations,
  getAdminChatMessages,
  sendAdminChatMessage,
} from '../controllers/chatSupportController.js';

const router = express.Router();

// Customer routes
router.get('/', authenticateToken, getMyChatMessages);
router.post('/', authenticateToken, sendChatMessage);

// Admin routes
router.get('/admin/conversations', authenticateToken, authorize('admin'), getAdminConversations);
router.get('/admin/conversations/:userId', authenticateToken, authorize('admin'), getAdminChatMessages);
router.post('/admin/conversations/:userId', authenticateToken, authorize('admin'), sendAdminChatMessage);

export default router;
