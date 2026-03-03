import { Router } from 'express';
import { pushOfflineQueue } from '../controllers/syncController.js';
import { authGuard } from '../middleware/auth.js';

const router = Router();

router.post('/queue', authGuard, pushOfflineQueue);

export default router;
