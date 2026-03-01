import { Router } from 'express';
import {
  getUserDocuments,
  uploadDocument,
  uploadMiddleware
} from '../controllers/documentController.js';
import { authGuard } from '../middleware/auth.js';

const router = Router();

router.post('/upload', authGuard, uploadMiddleware, uploadDocument);
router.get('/user', authGuard, getUserDocuments);

export default router;
