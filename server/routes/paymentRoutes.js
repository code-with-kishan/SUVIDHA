import { Router } from 'express';
import { createPayment, verifyPayment } from '../controllers/paymentController.js';
import { authGuard } from '../middleware/auth.js';

const router = Router();

router.post('/create', authGuard, createPayment);
router.post('/verify', authGuard, verifyPayment);

export default router;
