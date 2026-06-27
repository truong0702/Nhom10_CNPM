import express from 'express';
import { getFaqs } from '../controllers/support.js';

const router = express.Router();

router.get('/faqs', getFaqs);

export default router;
