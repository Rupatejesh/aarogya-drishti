import { Router } from 'express';
import { chatWithAarohi } from '../controllers/aarohi.controller.js';

const router = Router();

// Public endpoint: citizens, patients, doctors, and admins can ask Aarohi anytime
router.post('/chat', chatWithAarohi);

export default router;

