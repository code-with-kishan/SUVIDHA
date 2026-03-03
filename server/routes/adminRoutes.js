import { Router } from 'express';
import {
  closeItem,
  getDashboard,
  getSystemHealth,
  listAuditLogs,
  listComplaints,
  listRequests,
  listUsers,
  updateStatus
} from '../controllers/adminController.js';
import { adminLoginInit, adminLoginVerify } from '../controllers/authController.js';
import { authGuard, roleGuard } from '../middleware/auth.js';

const router = Router();

router.post('/login', adminLoginInit);
router.post('/login/verify', adminLoginVerify);
router.get('/dashboard', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), getDashboard);
router.get('/health', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), getSystemHealth);
router.get('/audit-logs', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), listAuditLogs);
router.put('/update-status/:id', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), updateStatus);
router.delete('/close/:id', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), closeItem);
router.get('/requests', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), listRequests);
router.get('/complaints', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), listComplaints);
router.get('/users', authGuard, roleGuard('ADMIN', 'SUPER_ADMIN'), listUsers);

export default router;
