import { Router } from 'express';
import { createComplaint, getUserComplaints } from '../controllers/complaintController.js';
import { authGuard } from '../middleware/auth.js';

const router = Router();

router.post('/', authGuard, createComplaint);
router.get('/user', authGuard, getUserComplaints);

export default router;
