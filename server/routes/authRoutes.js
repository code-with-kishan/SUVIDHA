import { Router } from 'express';
import { adminLogin, getProfile, sendOtp, verifyOtp } from '../controllers/authController.js';
import { authGuard } from '../middleware/auth.js';
import { otpRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/send-otp', otpRateLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/profile', authGuard, getProfile);
router.post('/admin/login', adminLogin);

export default router;
