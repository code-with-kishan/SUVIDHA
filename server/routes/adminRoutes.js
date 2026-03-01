import { Router } from 'express';
import {
  getDashboard,
  listComplaints,
  listRequests,
  listUsers,
  updateStatus
} from '../controllers/adminController.js';
import { adminLogin } from '../controllers/authController.js';
import { authGuard, roleGuard } from '../middleware/auth.js';

const router = Router();

router.post('/login', adminLogin);
router.get('/dashboard', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), getDashboard);
router.put('/update-status/:id', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), updateStatus);
router.get('/requests', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), listRequests);
router.get('/complaints', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), listComplaints);
router.get('/users', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), listUsers);

export default router;
